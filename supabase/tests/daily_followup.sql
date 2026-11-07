begin;
-- Synthetic users and records are rolled back; no real account is changed.
insert into auth.users(id) select ('13000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,7)n;
insert into public.profiles(id,display_name,is_active) select ('13000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'TODAY fixture '||n,true from generate_series(1,7)n on conflict(id)do update set is_active=true;
insert into public.user_roles(user_id,role) values
 ('13000000-0000-4000-8000-000000000001','headmaster'),('13000000-0000-4000-8000-000000000002','dean'),('13000000-0000-4000-8000-000000000003','discipline_officer'),
 ('13000000-0000-4000-8000-000000000004','teacher'),('13000000-0000-4000-8000-000000000005','discipline_staff'),('13000000-0000-4000-8000-000000000006','student'),('13000000-0000-4000-8000-000000000007','admin');
insert into public.school_classes(class_name,grade,academic_year)values('__TODAY_CLASS__','S1','TEST'),('__TODAY_OTHER__','S2','TEST'),('__TODAY_EMPTY__','S3','TEST');
insert into public.students(student_id,full_name,class_name,status) select '__TODAY_'||name||'__','TEST '||name,'__TODAY_CLASS__',case when name='INACTIVE' then 'Archived' else 'Active' end
 from unnest(array['ABSENT','RETURN','LATE','EXCUSED','UNKNOWN','FOUR','INACTIVE','LOW','WEIGHT','ZERO','PASS','NONE'])name;
insert into public.students(student_id,full_name,class_name)values('__TODAY_OTHER_STUDENT__','Other class','__TODAY_OTHER__');
update public.students set auth_user_id='13000000-0000-4000-8000-000000000006' where student_id='__TODAY_ABSENT__';
insert into public.teacher_class_assignments(teacher_user_id,class_name)values('13000000-0000-4000-8000-000000000004','__TODAY_CLASS__');
insert into public.attendance_sessions(id,class_name,attendance_date,period,status,submitted_by,attendance_type)
 select ('23000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'__TODAY_CLASS__',(now()at time zone'Africa/Kigali')::date-11+n,'Main','submitted','13000000-0000-4000-8000-000000000004','main' from generate_series(1,5)n;
-- Deliberately omit one row to prove an unknown mark does not become absence.
insert into public.attendance_records(session_id,student_id,status)
 select ('23000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,s.student_id,
 case when s.student_id='__TODAY_RETURN__'and n=5 then'present' when s.student_id='__TODAY_LATE__'and n=5 then'late'
 when s.student_id='__TODAY_EXCUSED__'and n=5 then'excused' when s.student_id='__TODAY_FOUR__'and n=1 then'present'
 when s.student_id in('__TODAY_ABSENT__','__TODAY_INACTIVE__','__TODAY_UNKNOWN__','__TODAY_RETURN__','__TODAY_LATE__','__TODAY_EXCUSED__','__TODAY_FOUR__')then'absent'else'present'end
 from public.students s cross join generate_series(1,5)n where s.class_name='__TODAY_CLASS__' and not(s.student_id='__TODAY_UNKNOWN__'and n=3);
insert into public.attendance_sessions(id,class_name,attendance_date,period,status,submitted_by,attendance_type)values
 ('23000000-0000-4000-8000-000000000009','__TODAY_CLASS__',(now()at time zone'Africa/Kigali')::date-6,'Extra lesson','submitted','13000000-0000-4000-8000-000000000004','period_followup');
insert into public.attendance_records(session_id,student_id,status)values('23000000-0000-4000-8000-000000000009','__TODAY_ABSENT__','present');
insert into public.import_batches(id,import_type,status,source_filename,row_count,created_by,applied_at)values
 ('33000000-0000-4000-8000-000000000001','academics','applied','synthetic-results.csv',6,'13000000-0000-4000-8000-000000000002',now()),
 ('33000000-0000-4000-8000-000000000002','discipline','applied','synthetic-discipline.csv',3,'13000000-0000-4000-8000-000000000003',now()),
 ('33000000-0000-4000-8000-000000000003','academics','failed','synthetic-failed.csv',1,'13000000-0000-4000-8000-000000000002',null),
 ('33000000-0000-4000-8000-000000000004','discipline','review','synthetic-review.csv',1,'13000000-0000-4000-8000-000000000003',null);
insert into public.academic_records(student_id,term,subject,score,maximum_score,recorded_on,import_batch_id,recorded_by)values
 ('__TODAY_LOW__','TEST RELEASE','A',20,50,current_date-1,'33000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002'),
 ('__TODAY_LOW__','TEST RELEASE','B',5,50,current_date-1,'33000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002'),
 ('__TODAY_WEIGHT__','TEST RELEASE','A',40,40,current_date-1,'33000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002'),
 ('__TODAY_WEIGHT__','TEST RELEASE','B',0,160,current_date-1,'33000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002'),
 ('__TODAY_ZERO__','TEST RELEASE','A',0,100,current_date-1,'33000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002'),
 ('__TODAY_PASS__','TEST RELEASE','A',50,100,current_date-1,'33000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002');
insert into public.discipline_import_snapshots(batch_id,student_id,official_total,snapshot_date)values
 ('33000000-0000-4000-8000-000000000002','__TODAY_LOW__',19,current_date-1),
 ('33000000-0000-4000-8000-000000000002','__TODAY_PASS__',20,current_date-1);
insert into public.workflow_items(item_type,student_id,requested_by,payload)values
 ('absence_justification','__TODAY_ABSENT__','13000000-0000-4000-8000-000000000006','{"explanation":"CONFIDENTIAL_REASON_NEVER_IN_TODAY"}'),
 ('student_change','__TODAY_ABSENT__','13000000-0000-4000-8000-000000000003','{"request":"Correct spelling"}');
insert into public.school_notifications(recipient_id,actor_id,action,target,priority)values('13000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000003','student_added','__TODAY_ABSENT__','high');
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.refresh_school_concerns();
do $$declare before_count integer;payload jsonb;begin
 if(select count(*)from public.school_concerns where student_id like'__TODAY_%'and category='attendance')<>1 then raise exception 'FAIL attendance threshold/returns/unknown/inactive/followup';end if;
 if not exists(select 1 from public.school_concerns where student_id='__TODAY_ABSENT__'and(evidence->>'absent_days')::integer=5)then raise exception 'FAIL five main registers';end if;
 if(select count(*)from public.school_concerns where student_id like'__TODAY_%'and category='academic')<>3 then raise exception 'FAIL academic threshold/missing/zero';end if;
 if not exists(select 1 from public.school_concerns where student_id='__TODAY_WEIGHT__'and(evidence->>'percentage')::numeric=20)then raise exception 'FAIL weighted maxima';end if;
 if(select count(*)from public.school_concerns where student_id like'__TODAY_%'and category='discipline')<>1 then raise exception 'FAIL discipline threshold';end if;
 select count(*)into before_count from public.school_concerns;perform public.refresh_school_concerns();
 if(select count(*)from public.school_concerns)<>before_count then raise exception 'FAIL duplicate detection';end if;
 payload:=public.school_today(current_date);
 if payload::text like'%CONFIDENTIAL_REASON%'or payload::text like'%explanations%'then raise exception 'FAIL headmaster explanation privacy';end if;
 if not exists(select 1 from jsonb_array_elements(payload->'tasks')t where t->>'kind'='roster_requests')then raise exception 'FAIL roster task';end if;
 if not exists(select 1 from jsonb_array_elements(payload->'tasks')t where t->>'kind'='priority_notices')then raise exception 'FAIL priority task';end if;
 if exists(select 1 from jsonb_array_elements(payload->'tasks')t where t->>'class_name'='__TODAY_EMPTY__')then raise exception 'FAIL empty class attendance task';end if;
 begin perform public.review_school_concern((select id from public.school_concerns where student_id='__TODAY_ABSENT__'),1,'Headmaster cannot close');raise exception 'FAIL headmaster review bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$declare c public.school_concerns;payload jsonb;begin
 if exists(select 1 from public.school_concerns where category='academic')then raise exception 'FAIL officer academic scope';end if;
 payload:=public.school_today(current_date);
 if exists(select 1 from jsonb_array_elements(payload->'tasks')t where t->>'kind'='explanations')then raise exception 'FAIL postponed explanation task is visible';end if;
 if payload::text like'%CONFIDENTIAL_REASON%'then raise exception 'FAIL reason in task payload';end if;
 select*into c from public.school_concerns where student_id='__TODAY_ABSENT__'and category='attendance';
 begin perform public.review_school_concern(c.id,c.revision-1,'Stale');raise exception 'FAIL stale review';exception when serialization_failure then null;end;
 perform public.review_school_concern(c.id,c.revision,'School contacted the student');
 begin perform public.review_school_concern(c.id,c.revision,'Repeated');raise exception 'FAIL repeated review';exception when serialization_failure then null;end;
 if jsonb_array_length(public.school_concern_history(c.id))<2 then raise exception 'FAIL category review history';end if;
 perform public.refresh_school_concerns();
 if not exists(select 1 from public.school_concerns where id=c.id and status='closed')then raise exception 'FAIL closed case reopened without new evidence';end if;
end $$;
reset role;
-- A new main absence without a return reopens the same case, not another copy.
insert into public.attendance_sessions(id,class_name,attendance_date,period,status,submitted_by,attendance_type)values('23000000-0000-4000-8000-000000000006','__TODAY_CLASS__',current_date-5,'Main','submitted','13000000-0000-4000-8000-000000000004','main');
insert into public.attendance_records(session_id,student_id,status)values('23000000-0000-4000-8000-000000000006','__TODAY_ABSENT__','absent');
set local role authenticated;
select public.refresh_school_concerns();
do $$begin
 if(select count(*)from public.school_concerns where student_id='__TODAY_ABSENT__'and category='attendance'and status='open')<>1 then raise exception 'FAIL reopening';end if;
end $$;
reset role;
insert into public.attendance_sessions(id,class_name,attendance_date,period,status,submitted_by,attendance_type)values('23000000-0000-4000-8000-000000000007','__TODAY_CLASS__',current_date-4,'Main','submitted','13000000-0000-4000-8000-000000000004','main');
insert into public.attendance_records(session_id,student_id,status)values('23000000-0000-4000-8000-000000000007','__TODAY_ABSENT__','present');
set local role authenticated;
select public.refresh_school_concerns();
do $$begin if not exists(select 1 from public.school_concerns where student_id='__TODAY_ABSENT__'and status='open')then raise exception 'FAIL return silently closed open concern';end if;end $$;
reset role;
-- Rewrite only synthetic fixture dates to leave space for a fresh five-day streak.
update public.attendance_sessions set attendance_date=attendance_date-10 where class_name='__TODAY_CLASS__';
insert into public.attendance_sessions(id,class_name,attendance_date,period,status,submitted_by,attendance_type)
 select ('23000000-0000-4000-8000-'||lpad((20+n)::text,12,'0'))::uuid,'__TODAY_CLASS__',current_date-5+n,'Main','submitted','13000000-0000-4000-8000-000000000004','main'from generate_series(1,5)n;
insert into public.attendance_records(session_id,student_id,status)select('23000000-0000-4000-8000-'||lpad((20+n)::text,12,'0'))::uuid,'__TODAY_ABSENT__','absent'from generate_series(1,5)n;
set local role authenticated;
select public.refresh_school_concerns();
do $$begin if(select count(*)from public.school_concerns where student_id='__TODAY_ABSENT__'and category='attendance')<>2 then raise exception 'FAIL new streak history';end if;end $$;
reset role;
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare c public.school_concerns;begin
 if exists(select 1 from public.school_concerns where category<>'academic')then raise exception 'FAIL Dean category scope';end if;
 select*into c from public.school_concerns where student_id='__TODAY_LOW__'and category='academic';
 perform public.review_school_concern(c.id,c.revision,'Arrange academic support');
 if jsonb_array_length(public.school_concern_history(c.id))<2 then raise exception 'FAIL category review history';end if;
 perform public.refresh_school_concerns();
 if not exists(select 1 from public.school_concerns where id=c.id and status='closed')then raise exception 'FAIL academic review lost';end if;
 begin perform public.school_followup_details('discipline');raise exception 'FAIL Dean discipline details';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Teacher/patron/student/legacy-admin cannot read or review any concerns.
do $$declare n integer;payload jsonb;begin
 for n in 4..7 loop
  perform set_config('request.jwt.claim.sub',('13000000-0000-4000-8000-'||lpad(n::text,12,'0')),true);execute'set local role authenticated';
  if exists(select 1 from public.school_concerns)then raise exception 'FAIL unauthorised concern read %',n;end if;
  if exists(select 1 from public.audit_events where entity_type='school_concern')then raise exception 'FAIL concern audit exposure %',n;end if;
  begin perform public.refresh_school_concerns();raise exception 'FAIL unauthorised scanner %',n;exception when insufficient_privilege then null;end;
  begin perform public.school_followup_details('attendance');raise exception 'FAIL unauthorised detail %',n;exception when insufficient_privilege then null;end;
  if n<7 then
   payload:=public.school_today(current_date+1);
   if n=4 and exists(select 1 from jsonb_array_elements(payload->'tasks')t where t->>'class_name'='__TODAY_OTHER__')then raise exception 'FAIL teacher other class task';end if;
   if n=5 and not exists(select 1 from jsonb_array_elements(payload->'tasks')t where t->>'class_name'='__TODAY_OTHER__')then raise exception 'FAIL patron schoolwide task';end if;
   if n=6 and jsonb_array_length(payload->'tasks')<>0 then raise exception 'FAIL student staff tasks';end if;
  else begin perform public.school_today(current_date);raise exception 'FAIL legacy admin Today';exception when insufficient_privilege then null;end;end if;
  execute'reset role';
 end loop;
end $$;
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000003',true);
update public.profiles set is_active=false where id='13000000-0000-4000-8000-000000000003';
set local role authenticated;
do $$begin
 if exists(select 1 from public.school_concerns)then raise exception 'FAIL disabled officer read';end if;
 begin perform public.school_today(current_date);raise exception 'FAIL disabled officer Today';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$begin
 if not exists(select 1 from public.audit_events where entity_type='school_concern'and action='concern_reopened')then raise exception 'FAIL reopen audit';end if;
 if not exists(select 1 from public.audit_events where entity_type='school_concern'and action='concern_reviewed')then raise exception 'FAIL review audit';end if;
 if exists(select 1 from public.students where student_id like'__TODAY_%'and(academic_score is not null or official_discipline_points is not null))then raise exception 'FAIL concerns changed scores';end if;
end $$;

-- Retained student views expose only the linked record and canonical applied sources.
reset role;
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000006',true);
set local role authenticated;
do $$declare result jsonb;before_count integer;begin
 result:=public.my_student_records();
 if result#>>'{student,student_id}'<>'__TODAY_ABSENT__' then raise exception 'FAIL own linked student summary';end if;
 if jsonb_array_length(result->'academic')<>0 or result->'discipline'<>'null'::jsonb then raise exception 'FAIL other students results exposed';end if;
 if jsonb_array_length(result->'attendance')=0 then raise exception 'FAIL retained own attendance view';end if;
 if result::text like'%CONFIDENTIAL_REASON%' or result::text like'%guardian%' then raise exception 'FAIL private explanation/contact in student summary';end if;
 select count(*)into before_count from public.workflow_items where item_type='absence_justification';
 begin perform public.submit_absence_explanation(gen_random_uuid(),'New online submission');raise exception 'FAIL deferred RPC accepts submissions';exception when feature_not_supported then null;end;
 begin insert into public.workflow_items(item_type,student_id,requested_by,payload)values('absence_justification','__TODAY_ABSENT__',auth.uid(),'{"explanation":"Must not be saved"}');raise exception 'FAIL direct deferred insert';exception when insufficient_privilege then null;end;
 if(select count(*)from public.workflow_items where item_type='absence_justification')<>before_count then raise exception 'FAIL historical explanations changed';end if;
end $$;
reset role;
update public.students set auth_user_id=null where student_id='__TODAY_ABSENT__';
update public.students set auth_user_id='13000000-0000-4000-8000-000000000006'where student_id='__TODAY_LOW__';
set local role authenticated;
do $$declare result jsonb;begin result:=public.my_student_records();
 if jsonb_array_length(result->'academic')<>2 or(result#>>'{discipline,official_total}')::numeric<>19 then raise exception 'FAIL own applied results missing';end if;
end $$;
reset role;
update public.students set auth_user_id=null where student_id='__TODAY_LOW__';
update public.students set auth_user_id='13000000-0000-4000-8000-000000000006'where student_id='__TODAY_ZERO__';
set local role authenticated;
do $$declare result jsonb;begin result:=public.my_student_records();
 if(result#>>'{academic,0,score}')::numeric<>0 then raise exception 'FAIL legitimate zero lost';end if;
end $$;
reset role;
update public.profiles set is_active=false where id='13000000-0000-4000-8000-000000000006';
set local role authenticated;
do $$begin begin perform public.my_student_records();raise exception 'FAIL disabled student summary';exception when insufficient_privilege then null;end;end $$;
reset role;
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$begin begin perform public.my_student_records();raise exception 'FAIL teacher summary impersonation';exception when insufficient_privilege then null;end;end $$;
reset role;
-- Restore only the synthetic officer and verify manual correction still works.
update public.profiles set is_active=true where id='13000000-0000-4000-8000-000000000003';
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$declare record uuid;begin
 select id into record from public.attendance_records where student_id='__TODAY_ABSENT__'and status='absent'limit 1;
 perform public.correct_main_attendance(record,'present','Student returned: reviewed by the Discipline Office');
 if not exists(select 1 from public.attendance_records where id=record and status='present')then raise exception 'FAIL officer correction after scope reduction';end if;
 if not exists(select 1 from public.workflow_items where item_type='absence_justification'and payload->>'explanation'='CONFIDENTIAL_REASON_NEVER_IN_TODAY')then raise exception 'FAIL old private explanation lost';end if;
end $$;
reset role;

rollback;
