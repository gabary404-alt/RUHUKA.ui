begin;
insert into auth.users(id,email) select ('14000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'fixture'||n||'@example.invalid'from generate_series(1,5)n;
insert into public.profiles(id,display_name,is_active)select('14000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'ACCOUNT fixture '||n,true from generate_series(1,5)n on conflict(id)do update set is_active=true;
insert into auth.sessions(id,user_id,created_at,updated_at)values('54000000-0000-4000-8000-000000000002','14000000-0000-4000-8000-000000000002',now(),now());
insert into public.user_roles(user_id,role)values('14000000-0000-4000-8000-000000000001','headmaster'),('14000000-0000-4000-8000-000000000002','teacher'),('14000000-0000-4000-8000-000000000003','discipline_officer'),('14000000-0000-4000-8000-000000000004','admin'),('14000000-0000-4000-8000-000000000005','student');
insert into public.school_classes(class_name,grade,academic_year)values('__ACCOUNT_CLASS__','S1','TEST');
insert into public.teacher_class_assignments(teacher_user_id,class_name)values('14000000-0000-4000-8000-000000000002','__ACCOUNT_CLASS__');
insert into public.students(student_id,full_name,class_name,status,academic_score,academic_term,official_discipline_points)values('__ACCOUNT_EXISTING__','Old name','__ACCOUNT_CLASS__','Archived',75,'KEEP',null);
update public.students set auth_user_id='14000000-0000-4000-8000-000000000005'where student_id='__ACCOUNT_EXISTING__';
select set_config('request.jwt.claim.sub','14000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$declare rows jsonb:='[{"student_id":"__ACCOUNT_EXISTING__","full_name":"New name","class_name":"__ACCOUNT_CLASS__"},{"student_id":"__ACCOUNT_NEW__","full_name":"New student","class_name":"__ACCOUNT_CLASS__"}]';p jsonb;r jsonb;again jsonb;begin
 p:=public.roster_preview(rows);
 if(p->>'added')::integer<>1 or(p->>'updated')::integer<>1 then raise exception 'FAIL preview counts';end if;
 if(select full_name from public.students where student_id='__ACCOUNT_EXISTING__')<>'Old name'then raise exception 'FAIL preview writes';end if;
 r:=public.roster_apply(rows,p->>'preview_token','44000000-0000-4000-8000-000000000001');again:=public.roster_apply(rows,p->>'preview_token','44000000-0000-4000-8000-000000000001');
 if r<>again then raise exception 'FAIL replay result';end if;
 if(select count(*)from public.audit_events where action='roster_import_row'and details->>'request_id'='44000000-0000-4000-8000-000000000001')<>2 then raise exception 'FAIL duplicate audit/write';end if;
 if not exists(select 1 from public.students where student_id='__ACCOUNT_EXISTING__'and status='Archived'and academic_score=75 and academic_term='KEEP'and official_discipline_points is null and auth_user_id='14000000-0000-4000-8000-000000000005'and full_name='New name')then raise exception 'FAIL preserved omitted fields/scores/status';end if;
 begin perform public.roster_preview('[{"student_id":"__ACCOUNT_NEW__","full_name":"A","class_name":"__ACCOUNT_CLASS__"},{"student_id":"__ACCOUNT_NEW__","full_name":"B","class_name":"__ACCOUNT_CLASS__"}]');raise exception 'FAIL duplicate file';exception when raise_exception then if sqlerrm='FAIL duplicate file'then raise;end if;end;
 begin perform public.roster_preview('[{"student_id":"__ACCOUNT_BAD__","full_name":"Bad","class_name":"no class"}]');raise exception 'FAIL unknown class';exception when raise_exception then if sqlerrm='FAIL unknown class'then raise;end if;end;
 begin perform public.roster_preview('[{"student_id":"__ACCOUNT_NEW__","full_name":"A","class_name":"__ACCOUNT_CLASS__","academic_score":99}]');raise exception 'FAIL score injection';exception when raise_exception then if sqlerrm='FAIL score injection'then raise;end if;end;
 begin perform public.roster_apply(rows,'stale','44000000-0000-4000-8000-000000000002');raise exception 'FAIL stale preview';exception when serialization_failure then null;end;
 if exists(select 1 from public.students where student_id='__ACCOUNT_BAD__')then raise exception 'FAIL partial save';end if;
 begin update public.profiles set is_active=false where id='14000000-0000-4000-8000-000000000002';raise exception 'FAIL direct profile write';exception when insufficient_privilege then null;end;
 begin insert into public.user_roles values('14000000-0000-4000-8000-000000000002','headmaster',auth.uid(),now());raise exception 'FAIL direct role write';exception when insufficient_privilege then null;end;
 perform public.staff_account_save('14000000-0000-4000-8000-000000000002','Test teacher',array['teacher'],false);
 
 if(select is_active from public.profiles where id='14000000-0000-4000-8000-000000000002')then raise exception 'FAIL disable';end if;
 perform public.staff_account_save('14000000-0000-4000-8000-000000000002','Test teacher',array['teacher'],true);
 begin perform public.staff_account_save(auth.uid(),'Self',array['teacher'],false);raise exception 'FAIL self lockout';exception when raise_exception then if sqlerrm='FAIL self lockout'then raise;end if;end;
 begin perform public.staff_account_save('14000000-0000-4000-8000-000000000005','Student',array['teacher'],true);raise exception 'FAIL student converted';exception when raise_exception then if sqlerrm='FAIL student converted'then raise;end if;end;
end $$;
reset role;
do $$begin if(select not_after is null from auth.sessions where id='54000000-0000-4000-8000-000000000002')then raise exception 'FAIL server session was not expired';end if;end $$;
-- Demonstrate shared attendance through different signed-in database identities.
update public.students set status='Active'where student_id='__ACCOUNT_EXISTING__';
select set_config('request.jwt.claim.sub','14000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin
 begin perform public.staff_directory();raise exception 'FAIL teacher directory access';exception when insufficient_privilege then null;end;
 begin perform public.roster_preview('[]');raise exception 'FAIL teacher bulk import';exception when insufficient_privilege then null;end;
 perform public.submit_main_attendance('__ACCOUNT_CLASS__',(now()at time zone'Africa/Kigali')::date,'[{"student_id":"__ACCOUNT_EXISTING__","status":"absent"},{"student_id":"__ACCOUNT_NEW__","status":"present"}]');
 begin perform public.submit_main_attendance('__ACCOUNT_CLASS__',(now()at time zone'Africa/Kigali')::date,'[{"student_id":"__ACCOUNT_EXISTING__","status":"present"},{"student_id":"__ACCOUNT_NEW__","status":"present"}]');raise exception 'FAIL duplicate main';exception when unique_violation then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','14000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$declare rec uuid; report jsonb; school_day date := (now() at time zone 'Africa/Kigali')::date;begin
 if not exists(select 1 from public.main_attendance_overview_v2((now()at time zone'Africa/Kigali')::date)where class_name='__ACCOUNT_CLASS__'and absent=1 and submitter_name='Test teacher')then raise exception 'FAIL officer visibility';end if;
 select r.id into rec from public.attendance_records r join public.attendance_sessions s on s.id=r.session_id where s.class_name='__ACCOUNT_CLASS__'and r.student_id='__ACCOUNT_EXISTING__';
 perform public.correct_main_attendance(rec,'present','Synthetic late-return review');
 if not exists(select 1 from public.audit_events where entity_id=rec::text and actor_user_id=auth.uid()and details->'before'->>'status'='absent'and details->'after'->>'status'='present')then raise exception 'FAIL correction audit';end if;
 if not exists(select 1 from public.class_main_attendance_summary('__ACCOUNT_CLASS__',school_day,school_day)where present_marks=2 and absent_marks=0)then raise exception 'FAIL corrected summary';end if;
 report := public.school_report('attendance','__ACCOUNT_CLASS__',school_day,school_day);
 if not exists (
  select 1 from jsonb_array_elements(report->'rows') student
  where student->>'student_id'='__ACCOUNT_EXISTING__'
    and (student->>'present')::int=1 and (student->>'absent')::int=0
 ) then raise exception 'FAIL correction missing from attendance report';end if;

end $$;
reset role;
select set_config('request.jwt.claim.sub','14000000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$begin
 if private.has_school_role(array['admin'])then raise exception 'FAIL legacy broad admin';end if;
 begin perform public.staff_directory();raise exception 'FAIL admin directory';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- A genuine-looking JWT session ID must still refer to a live server session.
select set_config('request.jwt.claims','{"sub":"14000000-0000-4000-8000-000000000002","session_id":"54000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
do $$begin if private.has_school_role(array['teacher'])then raise exception 'FAIL revoked/unknown session accepted';end if;end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"14000000-0000-4000-8000-000000000002","session_id":"54000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
do $$begin if private.has_school_role(array['teacher'])or public.school_access_state()is not null then raise exception 'FAIL old disabled session revived after re-enable';end if;end $$;
reset role;
rollback;
