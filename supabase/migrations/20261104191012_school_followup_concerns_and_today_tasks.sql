-- New follow-up cases are tasks for people, never changes to marks or points.
create table public.school_concerns (
 id uuid primary key default gen_random_uuid(),
 student_id text not null references public.students(student_id),
 category text not null check(category in ('attendance','academic','discipline')),
 source_key text not null,
 evidence jsonb not null,
 status text not null default 'open' check(status in ('open','closed')),
 revision integer not null default 1,
 opened_at timestamptz not null default now(),
 last_detected_at timestamptz not null default now(),
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 review_note text,
 unique(student_id,category,source_key)
);
create index school_concerns_open_category_idx on public.school_concerns(category,opened_at) where status='open';
create index school_concerns_reviewer_idx on public.school_concerns(reviewed_by);
alter table public.school_concerns enable row level security;
revoke all on public.school_concerns from anon,authenticated;
grant select on public.school_concerns to authenticated;
create policy concerns_authorised_read on public.school_concerns for select to authenticated using (
 private.has_school_role(array['headmaster'])
 or (category='academic' and private.has_school_role(array['dean']))
 or (category in ('attendance','discipline') and private.has_school_role(array['discipline_officer']))
);

-- No client-provided student totals or category decisions are trusted here.
create function private.refresh_school_concerns() returns void
language plpgsql security definer set search_path='' as $$
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
   jsonb_build_object('percentage',percentage,'threshold',50,'term',term,'recorded_on',recorded_on,'batch_id',import_batch_id,'sources',sources,'rule','Below 50% in the latest applied subject batch, weighted by maximum marks. Incomplete batches are not treated as zero.')
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
  elsif existing.status='closed' and candidate.category='attendance' then
   update public.school_concerns set status='open',revision=revision+1,evidence=candidate.evidence,last_detected_at=now(),reviewed_by=null,reviewed_at=null,review_note=null where id=existing.id;
   insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details) values(actor,'concern_reopened','school_concern',existing.id::text,jsonb_build_object('category',candidate.category,'student_id',candidate.student_id,'reason','Absence streak continues without a recorded return'));
  elsif existing.status='open' then
   update public.school_concerns set evidence=candidate.evidence,last_detected_at=now(),revision=revision+case when evidence is distinct from candidate.evidence then 1 else 0 end where id=existing.id;
  end if;
 end loop;
end;
$$;

create function private.review_school_concern(concern_id uuid,expected_revision integer,note text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.school_concerns;actor uuid:=auth.uid();
begin
 select * into c from public.school_concerns where id=concern_id for update;
 if actor is null or c.id is null or not(
  (c.category='academic' and private.has_school_role(array['dean']))
  or (c.category in ('attendance','discipline') and private.has_school_role(array['discipline_officer']))
 ) then raise exception 'Concern review is not permitted' using errcode='42501';end if;
 if c.status<>'open' or c.revision is distinct from expected_revision then raise exception 'This concern changed. Refresh and review the latest record.' using errcode='40001';end if;
 if coalesce(length(btrim(note)),0) not between 1 and 1000 then raise exception 'Write a review note (up to 1,000 characters).';end if;
 update public.school_concerns set status='closed',revision=revision+1,reviewed_by=actor,reviewed_at=now(),review_note=btrim(note) where id=c.id;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details) values(actor,'concern_reviewed','school_concern',c.id::text,jsonb_build_object('category',c.category,'student_id',c.student_id,'review_note',btrim(note),'evidence',c.evidence));
end;
$$;

create function public.refresh_school_concerns() returns void language sql security invoker set search_path='' as $$select private.refresh_school_concerns();$$;
create function public.review_school_concern(concern_id uuid,expected_revision integer,note text) returns void language sql security invoker set search_path='' as $$select private.review_school_concern(concern_id,expected_revision,note);$$;

-- The Today payload is deliberately small: counts and permitted actions, no private explanation text.
create function private.school_today(day date) returns jsonb language plpgsql security definer set search_path='' as $$
declare tasks jsonb:='[]';v record;actor uuid:=auth.uid();head boolean:=private.has_school_role(array['headmaster']);dean boolean:=private.has_school_role(array['dean']);officer boolean:=private.has_school_role(array['discipline_officer']);n integer;
begin
 if actor is null or not private.has_school_role(array['headmaster','dean','discipline_officer','discipline_staff','teacher','student']) then raise exception 'Active school account required' using errcode='42501';end if;
 if day is null then raise exception 'Choose a date';end if;
 if not private.has_school_role(array['student']) or head or dean or officer or private.has_school_role(array['teacher','discipline_staff']) then
  for v in select c.class_name from public.school_classes c where private.can_access_class(c.class_name)
   and exists(select 1 from public.students s where s.class_name=c.class_name and s.status='Active')
   and not exists(select 1 from public.attendance_sessions a where a.class_name=c.class_name and a.attendance_date=day and a.attendance_type='main' and a.status='submitted') order by c.class_name
  loop tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','missing_attendance','class_name',v.class_name,'title',v.class_name||' · Attendance not submitted','count',1,'action','attendance'));end loop;
 end if;
 if officer then
  select count(*) into n from public.workflow_items where item_type='absence_justification' and status='pending';
  if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','explanations','title','Absence explanations awaiting your review','count',n,'action','explanations'));end if;
 end if;
 if head then
  select count(*) into n from public.workflow_items where item_type='student_change' and status='pending';
  if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','roster_requests','title','Student corrections to review','count',n,'action','roster'));end if;
 end if;
 if head or dean or officer then
  for v in select c.category,count(*) as total from public.school_concerns c where c.status='open'
   and (head or(c.category='academic' and dean)or(c.category in ('attendance','discipline')and officer)) group by c.category order by c.category
  loop tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','concerns','category',v.category,'title',initcap(v.category)||' follow-ups to review','count',v.total,'action','concerns'));end loop;
  for v in select b.import_type,count(*) as total from public.import_batches b where b.status in ('review','failed')
   and ((b.import_type='academics' and(head or dean))or(b.import_type='discipline'and(head or officer))or(b.import_type='students'and head)) group by b.import_type order by b.import_type
  loop tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','upload_issues','import_type',v.import_type,'title',initcap(v.import_type)||' uploads needing attention','count',v.total,'action','uploads'));end loop;
 end if;
 select count(*) into n from public.school_notifications where recipient_id=actor and priority='high' and read_at is null;
 if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','priority_notices','title','High priority notifications','count',n,'action','notices'));end if;
 return jsonb_build_object('day',day,'checked_at',now(),'tasks',tasks);
end;
$$;
create function public.school_today(day date) returns jsonb language sql security invoker set search_path='' as $$select private.school_today(day);$$;

create function private.school_followup_details(category_filter text,include_closed boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.has_school_role(array['headmaster']) and not(category_filter='academic' and private.has_school_role(array['dean'])) and not(category_filter in ('attendance','discipline') and private.has_school_role(array['discipline_officer'])) then raise exception 'Concern access is not permitted' using errcode='42501';end if;
 if category_filter not in ('attendance','academic','discipline') or category_filter is null then raise exception 'Choose a concern category';end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.opened_at,q.id),'[]') into result from (
  select c.*,s.full_name,s.class_name from public.school_concerns c join public.students s on s.student_id=c.student_id
  where c.category=category_filter and (include_closed or c.status='open') order by c.opened_at,c.id limit 200
 )q;return result;
end;
$$;
create function public.school_followup_details(category_filter text,include_closed boolean default false) returns jsonb language sql security invoker set search_path='' as $$select private.school_followup_details(category_filter,include_closed);$$;

create function private.school_upload_issues(kind text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not private.has_school_role(array['headmaster']) and not(kind='academics' and private.has_school_role(array['dean'])) and not(kind='discipline' and private.has_school_role(array['discipline_officer'])) then raise exception 'Upload review access required' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (select id,import_type,status,source_filename,row_count,created_at from public.import_batches where import_type=kind and status in ('review','failed') order by created_at desc,id limit 100)q);
end;
$$;
create function public.school_upload_issues(kind text) returns jsonb language sql security invoker set search_path='' as $$select private.school_upload_issues(kind);$$;

revoke all on function private.refresh_school_concerns(),private.review_school_concern(uuid,integer,text),private.school_today(date),private.school_followup_details(text,boolean),private.school_upload_issues(text) from public,anon;
revoke all on function public.refresh_school_concerns(),public.review_school_concern(uuid,integer,text),public.school_today(date),public.school_followup_details(text,boolean),public.school_upload_issues(text) from public,anon;
grant execute on function private.refresh_school_concerns(),private.review_school_concern(uuid,integer,text),private.school_today(date),private.school_followup_details(text,boolean),private.school_upload_issues(text) to authenticated;
grant execute on function public.refresh_school_concerns(),public.review_school_concern(uuid,integer,text),public.school_today(date),public.school_followup_details(text,boolean),public.school_upload_issues(text) to authenticated;
