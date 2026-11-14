
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
do $$ declare rejected boolean:=false; begin
 begin select public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-05','[]'::jsonb); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL incomplete register accepted'; end if;
end $$;
do $$ declare rejected boolean:=false; begin
 begin select public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-05','[{"student_id":"WRONG","status":"present"}]'::jsonb); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL wrong class student accepted'; end if;
end $$;
do $$ declare rejected boolean:=false; begin
 begin select public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-05','[{"student_id":"__TEST_STUDENT__","status":"maybe"}]'::jsonb); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL invalid status accepted'; end if;
end $$;
do $$ declare rejected boolean:=false; begin
 begin select public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-05','[{"student_id":"__TEST_STUDENT__","status":"present"},{"student_id":"__TEST_STUDENT__","status":"absent"}]'::jsonb); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL duplicate student accepted'; end if;
end $$;
do $$ declare rejected boolean:=false; begin
 begin insert into public.attendance_sessions(class_name,attendance_date,period,status,submitted_by) values('__TEST_ATTENDANCE__','2026-11-05','Main','submitted',auth.uid()); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL direct main session insert accepted'; end if;
end $$;
do $$ declare rejected boolean:=false; begin
 begin insert into public.attendance_records(session_id,student_id,status) values('20000000-0000-4000-8000-000000000001','__TEST_STUDENT__','present'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL direct main record insert accepted'; end if;
end $$;
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

reset role;
update public.user_roles set role='discipline_staff' where user_id='10000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.submit_main_attendance('__TEST_ATTENDANCE__','2026-11-06','[{"student_id":"__TEST_STUDENT__","status":"late"}]'::jsonb);
do $$ declare rejected boolean:=false; begin
 begin select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','present','Not allowed'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL patron correction accepted'; end if;
end $$;

reset role;
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.main_attendance_overview('2026-11-06') where class_name='__TEST_ATTENDANCE__' and recorded=1 and absent=0) then raise exception 'FAIL patron overview'; end if;
end $$;
reset role;

reset role;
insert into auth.users(id) values('10000000-0000-4000-8000-000000000003');
insert into public.profiles(id,is_active) values('10000000-0000-4000-8000-000000000003',true) on conflict(id) do update set is_active=true;
insert into public.user_roles(user_id,role) values('10000000-0000-4000-8000-000000000003','student');
update public.students set auth_user_id='10000000-0000-4000-8000-000000000003' where student_id='__TEST_STUDENT__';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
-- The earlier correction test excused this record. Reset fixture as privileged setup.
update public.attendance_records set status='absent',note='New test absence' where id='30000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select set_config('test.explanation',public.submit_absence_explanation('30000000-0000-4000-8000-000000000001','Clinic appointment')::text,true);
do $$ begin
 if (select count(*) from public.workflow_items where id=current_setting('test.explanation')::uuid)<>1 then raise exception 'FAIL student cannot read own explanation'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.workflow_items where id=current_setting('test.explanation')::uuid) then raise exception 'FAIL patron can read explanation'; end if;
 begin
 perform public.review_absence_explanation(current_setting('test.explanation')::uuid,true,'Unauthorized');
 raise exception 'FAIL patron approved';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.review_absence_explanation(current_setting('test.explanation')::uuid,true,'Clinic explanation accepted');
do $$ begin
 if not exists(select 1 from public.attendance_records where id='30000000-0000-4000-8000-000000000001' and status='excused') then raise exception 'FAIL linked absence not excused'; end if;
 if not exists(select 1 from public.workflow_items where id=current_setting('test.explanation')::uuid and status='approved' and reviewed_by=auth.uid()) then raise exception 'FAIL review not saved'; end if;
 if not exists(select 1 from public.audit_events where entity_id='30000000-0000-4000-8000-000000000001' and details->'before'->>'status'='absent' and details->'after'->>'status'='excused') then raise exception 'FAIL officer cannot see correction audit'; end if;
end $$;
reset role;

reset role;
delete from public.user_roles where user_id='10000000-0000-4000-8000-000000000001';
insert into public.user_roles(user_id,role) values('10000000-0000-4000-8000-000000000001','headmaster');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.workflow_items where id=current_setting('test.explanation')::uuid) then raise exception 'FAIL headmaster can read private explanation'; end if;
end $$;
reset role;
update public.user_roles set role='dean' where user_id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 if exists(select 1 from public.workflow_items where id=current_setting('test.explanation')::uuid) then raise exception 'FAIL dean can read private explanation'; end if;
end $$;
reset role;

reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ declare rejected boolean:=false; begin begin perform public.review_absence_explanation(current_setting('test.explanation')::uuid,true,'Again'); exception when others then rejected:=true; end; if not rejected then raise exception 'FAIL repeated decision accepted'; end if; end $$;

select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','absent','New test absence');
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select set_config('test.rejected',public.submit_absence_explanation('30000000-0000-4000-8000-000000000001','Second request')::text,true);
do $$ declare rejected boolean:=false; begin begin perform public.submit_absence_explanation('30000000-0000-4000-8000-000000000001','Duplicate'); exception when others then rejected:=true; end; if not rejected then raise exception 'FAIL duplicate pending accepted'; end if; end $$;

reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.review_absence_explanation(current_setting('test.rejected')::uuid,false,'Private review decision');
do $$ begin
 if not exists(select 1 from public.attendance_records where id='30000000-0000-4000-8000-000000000001' and status='absent') then raise exception 'FAIL rejection changed attendance'; end if;
 if not exists(select 1 from public.audit_events where entity_id=current_setting('test.rejected') and details->>'after'='rejected') then raise exception 'FAIL rejection audit'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select set_config('test.stale',public.submit_absence_explanation('30000000-0000-4000-8000-000000000001','Awaiting review')::text,true);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','present','Returned late');
do $$ declare rejected boolean:=false; begin begin perform public.review_absence_explanation(current_setting('test.stale')::uuid,true,'Stale'); exception when others then rejected:=true; end; if not rejected then raise exception 'FAIL stale approval accepted'; end if; end $$;

do $$ begin
 if not exists(select 1 from public.workflow_items where id=current_setting('test.stale')::uuid and status='pending') then raise exception 'FAIL stale review lost pending request'; end if;
 if not exists(select 1 from public.main_attendance_overview_v2('2026-11-03') where class_name='__TEST_ATTENDANCE__' and submitter_name='TEST teacher' and corrected_records=1) then raise exception 'FAIL names/correction status'; end if;
end $$;
do $$ declare rejected boolean:=false; begin begin insert into public.audit_events(actor_user_id,action,entity_type) values(auth.uid(),'fake','attendance_record'); exception when others then rejected:=true; end; if not rejected then raise exception 'FAIL forged audit accepted'; end if; end $$;

reset role;
-- Give the first test account a student role linked to no student: cannot explain another student's record.
update public.user_roles set role='student' where user_id='10000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare rejected boolean:=false; begin begin perform public.submit_absence_explanation('30000000-0000-4000-8000-000000000001','Not mine'); exception when others then rejected:=true; end; if not rejected then raise exception 'FAIL cross-student explanation accepted'; end if; end $$;

do $$ begin
 if exists(select 1 from public.audit_events where entity_type='attendance_record') then raise exception 'FAIL student audit exposure'; end if;
end $$;
reset role;
update public.user_roles set role='headmaster' where user_id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 if exists(select 1 from public.audit_events where entity_type='workflow_item' and entity_id=current_setting('test.rejected')) then raise exception 'FAIL private review audit exposed to Headmaster'; end if;
end $$;
reset role;

reset role;
update public.user_roles set role='discipline_staff' where user_id='10000000-0000-4000-8000-000000000001';
update public.students set attendance_rate=5,absences=999 where student_id='__TEST_STUDENT__';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.submit_followup_attendance('__TEST_ATTENDANCE__','2026-11-03','Afternoon test','[{"student_id":"__TEST_STUDENT__","status":"absent"}]'::jsonb);
do $$ begin
 if not exists(select 1 from public.class_main_attendance_summary('__TEST_ATTENDANCE__','2026-11-03','2026-11-06') where main_sessions=3 and present_marks=2 and late_marks=1 and absent_marks=0 and attendance_rate=100) then raise exception 'FAIL followup/cache leaked into main totals'; end if;
 begin
  perform public.submit_followup_attendance('__TEST_ATTENDANCE__','2026-11-03','Afternoon test','[{"student_id":"__TEST_STUDENT__","status":"absent"}]'::jsonb);
  raise exception 'FAIL duplicate followup accepted';
 exception when unique_violation then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','excused','Excused absence');
do $$ begin
 if not exists(select 1 from public.class_main_attendance_summary('__TEST_ATTENDANCE__','2026-11-03','2026-11-06') where present_marks=1 and late_marks=1 and excused_marks=1 and absent_marks=0 and attendance_rate=100) then raise exception 'FAIL excused denominator'; end if;
end $$;
select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','absent','Absent again for test');
do $$ begin
 if not exists(select 1 from public.class_main_attendance_summary('__TEST_ATTENDANCE__','2026-11-03','2026-11-06') where present_marks=1 and late_marks=1 and excused_marks=0 and absent_marks=1 and attendance_rate=66.7) then raise exception 'FAIL absent denominator'; end if;
end $$;
select public.correct_main_attendance('30000000-0000-4000-8000-000000000001','present','Returned at midday');
do $$ begin
 if not exists(select 1 from public.class_main_attendance_summary('__TEST_ATTENDANCE__','2026-11-03','2026-11-06') where present_marks=2 and late_marks=1 and excused_marks=0 and absent_marks=0 and attendance_rate=100) then raise exception 'FAIL midday return'; end if;
 if not exists(select 1 from public.class_main_attendance_summary('__TEST_ATTENDANCE__','2026-12-01','2026-12-02') where attendance_rate is null and main_sessions=0) then raise exception 'FAIL empty range represented as zero'; end if;
end $$;
reset role;
rollback;
