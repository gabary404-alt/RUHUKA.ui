
begin;
insert into auth.users(id) values ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
insert into public.profiles(id,display_name) values ('10000000-0000-4000-8000-000000000001','TEST teacher'),('10000000-0000-4000-8000-000000000002','TEST officer') on conflict(id) do update set display_name=excluded.display_name;
insert into public.user_roles(user_id,role) values ('10000000-0000-4000-8000-000000000001','teacher'),('10000000-0000-4000-8000-000000000002','discipline_officer');
insert into public.school_classes(class_name,grade,academic_year) values ('__TEST_ATTENDANCE__','S1','2026');
insert into public.students(student_id,full_name,class_name) values ('__TEST_STUDENT__','Temporary test','__TEST_ATTENDANCE__');
insert into public.teacher_class_assignments(teacher_user_id,class_name) values ('10000000-0000-4000-8000-000000000001','__TEST_ATTENDANCE__');
insert into public.attendance_sessions(id,class_name,attendance_date,period,status,submitted_by) values ('20000000-0000-4000-8000-000000000001','__TEST_ATTENDANCE__','2026-11-03','Main','submitted','10000000-0000-4000-8000-000000000001');
insert into public.attendance_records(id,session_id,student_id,status) values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','__TEST_STUDENT__','absent');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-04','[{"student_id":"__TEST_STUDENT__","status":"present"}]'::jsonb);
do $$ begin
 begin
  perform public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-04','[{"student_id":"__TEST_STUDENT__","status":"absent"}]'::jsonb);
  raise exception 'FAIL duplicate submission accepted';
 exception when unique_violation then null; end;
end $$;
do $$ declare n integer; begin
 update public.attendance_records set status='present' where student_id='__TEST_STUDENT__';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL teacher updated submitted mark'; end if;
 begin
  perform public.correct_main_attendance('30000000-0000-4000-8000-000000000001','present','Not allowed');
  raise exception 'FAIL teacher RPC accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','excused','Approved clinic absence');
reset role;
do $$ begin
 if not exists(select 1 from public.attendance_records where student_id='__TEST_STUDENT__' and status='excused') then raise exception 'FAIL correction'; end if;
 if not exists(select 1 from public.audit_events where entity_id='30000000-0000-4000-8000-000000000001' and details->'before'->>'status'='absent' and details->'after'->>'status'='excused') then raise exception 'FAIL audit'; end if;
end $$;
rollback;
