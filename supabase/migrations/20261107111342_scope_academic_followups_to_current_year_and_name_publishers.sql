CREATE OR REPLACE FUNCTION private.refresh_school_concerns()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare candidate record; existing public.school_concerns; today date:=(now() at time zone 'Africa/Kigali')::date; actor uuid:=auth.uid();
begin
 if actor is null or not private.has_school_role(array['headmaster','dean','discipline_officer']) then raise exception 'School review access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('ruhuka-school-concerns',0));
 for candidate in
  with marks as (
   select s.student_id,s.class_name,a.attendance_date,r.id as record_id,r.status,
    sum(case when r.status='absent' then 0 else 1 end) over(partition by s.student_id order by a.attendance_date desc) as breaks
   from public.students s join public.attendance_sessions a on a.class_name=s.class_name
    and a.attendance_type='main' and a.status='submitted' and a.attendance_date<=today
   left join public.attendance_records r on r.session_id=a.id and r.student_id=s.student_id
   where s.status='Active'
  ), streaks as (
   select student_id,class_name,min(attendance_date) as first_day,max(attendance_date) as last_day,
    count(*) as absent_days,jsonb_agg(jsonb_build_object('date',attendance_date,'record_id',record_id) order by attendance_date) as sources
   from marks where breaks=0 and status='absent' group by student_id,class_name having count(*)>=5
  ), academic_batches as (
   select a.student_id,a.import_batch_id,a.term,max(a.recorded_on) as recorded_on,b.applied_at,
    count(*)=count(a.score) and count(*)=count(a.maximum_score) and bool_and(a.maximum_score>0 and a.score>=0 and a.score<=a.maximum_score) as complete,
    100*sum(a.score)/nullif(sum(a.maximum_score),0) as percentage,
    jsonb_agg(a.id order by a.id) as sources
   from public.academic_records a join public.import_batches b on b.id=a.import_batch_id and b.status='applied' and b.import_type='academics'
   join public.students s on s.student_id=a.student_id and s.status='Active'
   where a.recorded_on<=today group by a.student_id,a.import_batch_id,a.term,b.applied_at
   union all
   select r.student_id,a.batch_id as import_batch_id,a.release_name as term,a.recorded_on,a.created_at as applied_at,
    r.overall is not null as complete,r.overall as percentage,jsonb_build_array(a.id)as sources
   from public.academic_release_results r join public.academic_releases a on a.id=r.release_id join public.students st on st.student_id=r.student_id and st.status='Active' and st.class_name=a.class_name
   join public.school_classes sc on sc.class_name=st.class_name and sc.academic_year=a.academic_year
   where a.recorded_on<=today and not exists(select 1 from public.academic_releases newer where newer.replaces_id=a.id)
  ), latest_academic as (
   select distinct on(student_id) * from academic_batches order by student_id,recorded_on desc,applied_at desc nulls last,import_batch_id desc,term
  ), latest_discipline as (
   select distinct on(d.student_id) d.* from public.discipline_import_snapshots d
   join public.import_batches b on b.id=d.batch_id and b.status='applied' and b.import_type='discipline'
   join public.students s on s.student_id=d.student_id and s.status='Active'
   where d.snapshot_date<=today order by d.student_id,d.snapshot_date desc,b.applied_at desc nulls last,d.batch_id desc
  )
  select student_id,'attendance'::text as category,class_name||':'||first_day::text as source_key,
   jsonb_build_object('class_name',class_name,'first_day',first_day,'last_day',last_day,'absent_days',absent_days,'sources',sources,'rule','Five consecutive recorded main registers. Unsubmitted days are unknown; follow-up lessons do not count.') as evidence from streaks
  union all
  select student_id,'academic',import_batch_id::text||':'||term,
   jsonb_build_object('percentage',percentage,'threshold',50,'term',term,'recorded_on',recorded_on,'batch_id',import_batch_id,'sources',sources,'rule','Below 50% in the latest recorded academic source. Named releases use the supplied overall percentage; older subject batches use weighted maxima. Missing values are not zero.')
   from latest_academic where complete and percentage<50
  union all
  select student_id,'discipline',batch_id::text,
   jsonb_build_object('official_total',official_total,'maximum',40,'threshold',20,'snapshot_date',snapshot_date,'batch_id',batch_id,'rule','Below 20/40 in the latest applied official discipline snapshot. No points are changed.')
   from latest_discipline where official_total<20
 loop
  select * into existing from public.school_concerns c where c.student_id=candidate.student_id and c.category=candidate.category and c.source_key=candidate.source_key for update;
  if not found then
   insert into public.school_concerns(student_id,category,source_key,evidence) values(candidate.student_id,candidate.category,candidate.source_key,candidate.evidence) returning * into existing;
   insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details) values(actor,'concern_detected','school_concern',existing.id::text,jsonb_build_object('category',candidate.category,'student_id',candidate.student_id,'source_key',candidate.source_key));
  elsif existing.status='closed' and candidate.category='attendance'
   and (candidate.evidence->>'last_day')::date > (existing.evidence->>'last_day')::date then
   update public.school_concerns set status='open',revision=revision+1,evidence=candidate.evidence,last_detected_at=now(),reviewed_by=null,reviewed_at=null,review_note=null where id=existing.id;
   insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details) values(actor,'concern_reopened','school_concern',existing.id::text,jsonb_build_object('category',candidate.category,'student_id',candidate.student_id,'reason','Absence streak continues without a recorded return'));
  elsif existing.status='open' then
   update public.school_concerns set evidence=candidate.evidence,last_detected_at=now(),revision=revision+case when evidence is distinct from candidate.evidence then 1 else 0 end where id=existing.id;
  end if;
 end loop;
end;
$function$
;

create or replace function private.academic_release_detail(release_id uuid,include_inactive boolean default false)returns jsonb language plpgsql security definer set search_path=''as $$
declare a public.academic_releases;result jsonb;
begin
 select *into a from public.academic_releases where id=release_id;if not found then raise exception 'Release not found';end if;
 if not(private.has_school_role(array['headmaster','dean'])or(private.has_school_role(array['teacher'])and private.can_access_class(a.class_name)))then raise exception 'Academic class access required'using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('student_id',r.student_id,'full_name',r.full_name,'marks',r.marks,'overall',r.overall,'calculated',r.calculated,'rank',r.published_rank,'current_status',s.status)order by r.published_rank nulls last,r.student_id),'[]')into result from public.academic_release_results r join public.students s on s.student_id=r.student_id where r.release_id=a.id and(include_inactive or(s.status='Active'and s.class_name=a.class_name));
 return jsonb_build_object('id',a.id,'class_name',a.class_name,'academic_year',a.academic_year,'release_name',a.release_name,'recorded_on',a.recorded_on,'subjects',a.subjects,'rows',result,'warnings',a.warnings,'override_reason',a.override_reason,'created_by',a.created_by,'creator_name',(select display_name from public.profiles where id=a.created_by),'created_at',a.created_at,'replaces_id',a.replaces_id,'superseded_by',(select id from public.academic_releases where replaces_id=a.id));
end;$$;
