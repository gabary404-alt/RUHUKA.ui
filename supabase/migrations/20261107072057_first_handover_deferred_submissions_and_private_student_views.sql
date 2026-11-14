
-- Preserve old records and officer correction/review functions; stop new student submissions.
create or replace function private.submit_absence_explanation(record_id uuid,explanation text)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 raise exception 'Online absence submissions are postponed. Contact the Discipline Office.' using errcode='0A000';
end;
$$;
revoke all on function private.submit_absence_explanation(uuid,text) from public,anon;
grant execute on function private.submit_absence_explanation(uuid,text) to authenticated;
create policy first_handover_no_new_student_absence on public.workflow_items as restrictive
for insert to authenticated with check(item_type<>'absence_justification');
CREATE OR REPLACE FUNCTION private.school_today(day date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
-- A zero-argument, ownership-checked read: no student ID can be supplied by the browser.
create function private.my_student_records() returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.students; result jsonb;actor uuid:=auth.uid();today date:=(now()at time zone'Africa/Kigali')::date;
begin
 if actor is null or not private.has_school_role(array['student'])then raise exception 'Active student account required'using errcode='42501';end if;
 if (select count(*)from public.students where auth_user_id=actor)>1 then raise exception 'More than one linked student record. Contact the school administrator.';end if;
 select *into s from public.students where auth_user_id=actor;
 if s.student_id is null then return jsonb_build_object('student',null,'academic','[]'::jsonb,'attendance','[]'::jsonb,'discipline',null,'discipline_events','[]'::jsonb);end if;
 result:=jsonb_build_object('student',jsonb_build_object('student_id',s.student_id,'full_name',s.full_name,'class_name',s.class_name,'status',s.status),
 'academic',(select coalesce(jsonb_agg(to_jsonb(q)order by q.recorded_on desc,q.subject),'[]')from(
 select a.id,a.term,a.subject,a.score,a.maximum_score,a.recorded_on from public.academic_records a join public.import_batches b on b.id=a.import_batch_id and b.status='applied'and b.import_type='academics'
 where a.student_id=s.student_id and a.recorded_on<=today order by a.recorded_on desc,a.id limit 200)q),
 'attendance',(select coalesce(jsonb_agg(to_jsonb(q)order by q.attendance_date desc),'[]')from(
 select a.attendance_date,r.status from public.attendance_records r join public.attendance_sessions a on a.id=r.session_id and a.status='submitted'and a.attendance_type='main'
 where r.student_id=s.student_id and a.attendance_date<=today order by a.attendance_date desc limit 100)q),
 'discipline',(select to_jsonb(q)from(select d.official_total,d.snapshot_date from public.discipline_import_snapshots d join public.import_batches b on b.id=d.batch_id and b.status='applied'and b.import_type='discipline'
 where d.student_id=s.student_id and d.snapshot_date<=today order by d.snapshot_date desc,b.applied_at desc nulls last,d.batch_id desc limit 1)q),
 'discipline_events',(select coalesce(jsonb_agg(to_jsonb(q)order by q.event_date desc),'[]')from(select d.event_date,d.reason,d.reported_change,d.source_recorded_by
 from public.discipline_events d join public.import_batches b on b.id=d.import_batch_id and b.status='applied'and b.import_type='discipline'
 where d.student_id=s.student_id and d.event_date<=today order by d.event_date desc,d.id limit 50)q));
 return result;
end;
$$;
create function public.my_student_records() returns jsonb language sql security invoker set search_path=''as $$select private.my_student_records();$$;
revoke all on function public.my_student_records(),private.my_student_records()from public,anon;
grant execute on function public.my_student_records(),private.my_student_records()to authenticated;
