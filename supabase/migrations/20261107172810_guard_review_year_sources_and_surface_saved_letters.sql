create or replace function private.set_progression_threshold(academic_year text,threshold numeric)returns void language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['dean'])then raise exception 'Dean of Studies access required'using errcode='42501';end if;
 if coalesce(length(btrim(academic_year)),0)not between 1 and 30 or threshold is null or threshold<0 or threshold>100 then raise exception 'Choose year and review threshold from 0 to 100';end if;
 insert into private.progression_policy(academic_year,review_threshold,updated_by)values(btrim(academic_year),threshold,auth.uid())on conflict on constraint progression_policy_pkey do update set review_threshold=excluded.review_threshold,updated_by=auth.uid(),updated_at=now();
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'progression_review_threshold','academic_year',btrim(academic_year),jsonb_build_object('threshold',threshold,'automatic_decisions',false));
end;$$;

create or replace function private.build_class_letter(filters jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare result jsonb;att jsonb;ac jsonb;disc jsonb;ar public.academic_releases;dr public.discipline_releases;cls text;year text;first_day date;last_day date;aid uuid;did uuid;returns integer;manifest jsonb;
begin
 if not private.has_school_role(array['headmaster','dean','discipline_officer'])then raise exception 'School letter access required'using errcode='42501';end if;
 if jsonb_typeof(filters)is distinct from'object'or exists(select 1 from jsonb_object_keys(filters)k where k not in('class_name','academic_year','start_day','end_day','academic_release_id','discipline_release_id'))then raise exception 'Invalid class letter filters';end if;
 cls:=filters->>'class_name';year:=btrim(filters->>'academic_year');first_day:=(filters->>'start_day')::date;last_day:=(filters->>'end_day')::date;
 if coalesce(length(year),0)not between 1 and 30 then raise exception 'Choose the school year';end if;
 if not(exists(select 1 from public.school_classes c where c.class_name=cls and c.academic_year=year)or exists(select 1 from public.academic_releases a where a.class_name=cls and a.academic_year=year)or exists(select 1 from public.discipline_releases d where d.class_name=cls and d.academic_year=year)or exists(select 1 from private.student_enrolment_history h where(h.previous_state->>'class_name'=cls and h.previous_state->>'academic_year'=year)or(h.next_state->>'class_name'=cls and h.next_state->>'academic_year'=year)))then raise exception 'Choose a recorded school year for this class';end if;
 att:=private.school_report('attendance',cls,first_day,last_day,null);
 select count(distinct r.id)into returns from public.attendance_records r join public.attendance_sessions a on a.id=r.session_id
 where a.class_name=cls and a.attendance_type='main'and a.status='submitted'and a.attendance_date between first_day and last_day and r.status in('present','late')and exists(select 1 from public.audit_events e where e.entity_type='attendance_record'and e.entity_id=r.id::text and e.details->'before'->>'status'='absent'and e.details->'after'->>'status'in('present','late'));
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'student_id',r.student_id,'status',r.status)order by r.id),'[]')into manifest from public.attendance_records r join public.attendance_sessions a on a.id=r.session_id where a.class_name=cls and a.attendance_type='main'and a.status='submitted'and a.attendance_date between first_day and last_day;
 -- No attendance names, correction reasons, explanations or medical evidence enter the letter.
 att:=jsonb_build_object('totals',att->'totals','coverage',att->>'coverage','source_ids',att->'source_ids','returned_records',returns,'record_manifest_hash',encode(sha256(convert_to(manifest::text,'UTF8')),'hex'),'expected_registers',null,'expected_coverage','Expected school-day coverage is not configured; unsubmitted dates are unknown.');
 aid:=nullif(filters->>'academic_release_id','')::uuid;did:=nullif(filters->>'discipline_release_id','')::uuid;
 if aid is not null then
  select *into ar from public.academic_releases where id=aid;
  if not found or ar.class_name<>cls or ar.academic_year<>year or ar.recorded_on not between first_day and last_day then raise exception 'Choose an academic release for this class, year and period';end if;
  select jsonb_build_object('release_id',ar.id,'release_name',ar.release_name,'recorded_on',ar.recorded_on,'created_by',ar.created_by,'creator_name',(select display_name from public.profiles where id=ar.created_by),'created_at',ar.created_at,'cohort','Original release cohort; later moves do not rewrite this source.','students',count(*),'recorded_totals',count(r.overall),'missing_totals',count(*)filter(where r.overall is null),'zero_totals',count(*)filter(where r.overall=0),'mean_percentage',round(avg(r.overall),2),'missing_subject_marks',(select count(*)from public.academic_release_results rr cross join lateral jsonb_each(rr.marks)m where rr.release_id=ar.id and m.value='null'::jsonb),'warning_count',jsonb_array_length(ar.warnings),'superseded_by',(select id from public.academic_releases where replaces_id=ar.id))into ac from public.academic_release_results r where r.release_id=ar.id;
 end if;
 if did is not null then
  select *into dr from public.discipline_releases where id=did;
  if not found or dr.class_name<>cls or dr.academic_year<>year or dr.recorded_on not between first_day and last_day then raise exception 'Choose a discipline snapshot for this class, year and period';end if;
  select jsonb_build_object('release_id',dr.id,'release_name',dr.release_name,'recorded_on',dr.recorded_on,'source_reference',dr.source_reference,'uploaded_by',dr.created_by,'uploader_name',(select display_name from public.profiles where id=dr.created_by),'uploaded_at',dr.created_at,'cohort','Original snapshot cohort. Totals are official, not a sum of events.','students',jsonb_array_length(dr.source_rows),'below_20',count(*)filter(where(x->>'official_total')::numeric<20),'rows',dr.source_rows,'events',(select coalesce(jsonb_agg(e order by e->>'event_date',e->>'event_key'),'[]')from jsonb_array_elements(dr.source_events)e where(e->>'event_date')::date between first_day and last_day),'superseded_by',(select id from public.discipline_releases where replaces_id=dr.id))into disc from jsonb_array_elements(dr.source_rows)x;
 end if;
 result:=jsonb_build_object('class_name',cls,'academic_year',year,'from',first_day,'to',last_day,'attendance',att,'academic',ac,'discipline',disc,'rules','Recorded main attendance only. Missing data stays Not recorded. Academic and discipline results stay separate. Original release cohorts can differ; no combined student ranking.','source_fingerprints',jsonb_build_object('academic',ar.payload_hash,'discipline',dr.payload_hash));
 return jsonb_build_object('snapshot',result,'preview_token',encode(sha256(convert_to(result::text,'UTF8')),'hex'));
end;$$;

create or replace function private.save_class_letter(data jsonb,preview_token text,request_id uuid)returns uuid language plpgsql security definer set search_path=''as $$
declare prior private.class_letters;p jsonb;parent private.class_letters;parent_key uuid;rid uuid:=gen_random_uuid();fingerprint text:=encode(sha256(convert_to(data::text,'UTF8')),'hex');dedupe text;begin
 if not private.has_school_role(array['dean','discipline_officer'])then raise exception 'Dean or Discipline Officer authors class letters'using errcode='42501';end if;
 if jsonb_typeof(data)is distinct from'object'or exists(select 1 from jsonb_object_keys(data)k where k not in('filters','title','comments','parent_id','review_confirmed'))or data->'review_confirmed'is distinct from'true'::jsonb then raise exception 'Review and confirm the class letter';end if;
 if jsonb_typeof(data->'title')is distinct from'string'or coalesce(length(btrim(data->>'title')),0)not between 1 and 160 or jsonb_typeof(data->'comments')is distinct from'string'or length(data->>'comments')>5000 then raise exception 'Use a short title and comments up to 5000 characters';end if;
 if request_id is null then raise exception 'Request ID required';end if;
 perform pg_advisory_xact_lock(hashtextextended('class-letter-request:'||request_id::text,0));
 select *into prior from private.class_letters a where a.request_id=save_class_letter.request_id;
 if found then if prior.created_by<>auth.uid()or prior.payload_hash<>fingerprint then raise exception 'Request differs from original saved letter';end if;return prior.id;end if;
 perform 1 from public.school_classes where class_name=data->'filters'->>'class_name'for update;
 perform 1 from public.attendance_records r join public.attendance_sessions a on a.id=r.session_id where a.class_name=data->'filters'->>'class_name'and a.attendance_type='main'and a.attendance_date between(data->'filters'->>'start_day')::date and(data->'filters'->>'end_day')::date order by r.id for share of r;
 p:=private.build_class_letter(data->'filters');
 if p->'snapshot'->'academic'->>'superseded_by'is not null or p->'snapshot'->'discipline'->>'superseded_by'is not null then raise exception 'Selected results have a corrected version. Choose the current source and review again.'using errcode='40001';end if;
 if p->>'preview_token'is distinct from preview_token then raise exception 'Source records changed. Generate and review the letter again.'using errcode='40001';end if;
 parent_key:=nullif(data->>'parent_id','')::uuid;
 if parent_key is not null then
  select *into parent from private.class_letters where id=parent_key for update;
  if not found or parent.class_name<>p->'snapshot'->>'class_name'or parent.academic_year<>p->'snapshot'->>'academic_year'or parent.starts_on<>(p->'snapshot'->>'from')::date or parent.ends_on<>(p->'snapshot'->>'to')::date then raise exception 'A new version must keep the class, school year and period';end if;
  if exists(select 1 from private.class_letters where parent_id=parent_key)then raise exception 'A newer letter version already exists. Open that version.'using errcode='40001';end if;
 end if;
 dedupe:=encode(sha256(convert_to(auth.uid()::text||fingerprint||preview_token,'UTF8')),'hex');select *into prior from private.class_letters where dedupe_hash=dedupe;if found then return prior.id;end if;
 insert into private.class_letters(id,class_name,academic_year,starts_on,ends_on,title,comments,filters,snapshot,source_hash,parent_id,created_by,request_id,payload_hash,dedupe_hash)
 values(rid,p->'snapshot'->>'class_name',p->'snapshot'->>'academic_year',(p->'snapshot'->>'from')::date,(p->'snapshot'->>'to')::date,btrim(data->>'title'),data->>'comments',data->'filters',p->'snapshot',p->>'preview_token',parent_key,auth.uid(),request_id,fingerprint,dedupe);
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'class_letter_saved','class_letter',rid::text,jsonb_build_object('parent_id',parent_key,'source_hash',preview_token,'review_confirmed',true));
 insert into public.school_notifications(recipient_id,actor_id,action,target)select distinct r.user_id,auth.uid(),'class_letter_saved',rid::text from public.user_roles r join public.profiles pr on pr.id=r.user_id where r.role='headmaster'and pr.is_active;
 return rid;
end;$$;

do $patch$declare src text;begin select pg_get_functiondef('private.school_today(date)'::regprocedure)into src;
 src:=replace(src,' select count(*) into n from public.school_notifications where recipient_id=actor and priority=', $insert$ if head then
 select count(*)into n from public.school_notifications where recipient_id=actor and read_at is null and action='class_letter_saved';
 if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','class_letters','title','Class letters ready to read','count',n,'action','notices'));end if;
 end if;
 select count(*) into n from public.school_notifications where recipient_id=actor and priority=$insert$);execute src;
end;$patch$;
