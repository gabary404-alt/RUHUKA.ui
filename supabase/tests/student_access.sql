begin;
insert into auth.users(id)values('21000000-0000-4000-8000-000000000001'),('21000000-0000-4000-8000-000000000002'),('21000000-0000-4000-8000-000000000003'),('21000000-0000-4000-8000-000000000004');
insert into public.profiles(id,display_name,is_active)select id,'Synthetic access fixture',true from auth.users where id::text like'21000000-%'on conflict(id)do update set is_active=true;
insert into public.user_roles(user_id,role)values('21000000-0000-4000-8000-000000000001','headmaster'),('21000000-0000-4000-8000-000000000002','discipline_officer'),('21000000-0000-4000-8000-000000000003','teacher');
insert into public.school_classes(class_name,grade,academic_year)values('__ACCESS_CLASS__','S1','TEST');
insert into public.students(student_id,full_name,class_name)values('__ACCESS_STUDENT__','Synthetic student','__ACCESS_CLASS__');
create temporary table access_test(code text,code_id uuid,new_code text);grant all on access_test to authenticated,service_role;
select set_config('request.jwt.claim.sub','21000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare c jsonb;d jsonb;begin
 c:=public.student_code_issue('__ACCESS_STUDENT__','setup');insert into access_test values(c->>'code',(c->>'code_id')::uuid,null);
 d:=public.student_access_state('__ACCESS_STUDENT__');if d::text like'%'||(c->>'code')||'%'or d::text like'%code_hash%'then raise exception 'FAIL history exposes setup secret';end if;
 begin perform public.student_login_target('__ACCESS_STUDENT__');raise exception 'FAIL client account email lookup';exception when insufficient_privilege then null;end;
 begin perform public.student_code_consume('__ACCESS_STUDENT__',c->>'code');raise exception 'FAIL client redemption bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$begin if exists(select 1 from private.student_access_codes c,access_test t where c.code_hash=t.code)then raise exception 'FAIL plaintext code storage';end if;end $$;
set local role service_role;
do $$declare c jsonb;begin
 c:=public.student_code_consume('__ACCESS_STUDENT__',(select code from access_test));if c->>'student_id'<>'__ACCESS_STUDENT__'then raise exception 'FAIL valid code';end if;
 if public.student_code_consume('__ACCESS_STUDENT__',(select code from access_test))is not null then raise exception 'FAIL code replay';end if;
end $$;
reset role;
-- Emulate the Auth-admin-created identity without setting or exposing any real password.
update auth.users set email='s.'||encode(sha256(convert_to('__ACCESS_STUDENT__','UTF8')),'hex')||'@students.ruhuka.invalid'where id='21000000-0000-4000-8000-000000000004';
set local role service_role;
select public.student_code_finish((select code_id from access_test),'21000000-0000-4000-8000-000000000004');
do $$declare r jsonb;begin
 r:=public.student_login_target('__ACCESS_STUDENT__');if r->>'user_id'<>'21000000-0000-4000-8000-000000000004'then raise exception 'FAIL linked student login';end if;
 begin perform public.student_code_finish((select code_id from access_test),'21000000-0000-4000-8000-000000000004');raise exception 'FAIL finish replay';exception when raise_exception then if sqlerrm='FAIL finish replay'then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','21000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare c jsonb;begin
 c:=public.student_code_issue('__ACCESS_STUDENT__','reset');update access_test set new_code=c->>'code';
 begin perform public.student_access_enabled('__ACCESS_STUDENT__',false);raise exception 'FAIL officer disables student';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','21000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.student_access_enabled('__ACCESS_STUDENT__',false);
reset role;
set local role service_role;
do $$begin if public.student_login_target('__ACCESS_STUDENT__')is not null then raise exception 'FAIL disabled login';end if;if public.student_code_consume('__ACCESS_STUDENT__',(select new_code from access_test))is not null then raise exception 'FAIL disabled code';end if;end $$;
reset role;
select set_config('request.jwt.claim.sub','21000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.student_access_enabled('__ACCESS_STUDENT__',true);
do $$declare c jsonb;begin c:=public.student_code_issue('__ACCESS_STUDENT__','reset');update access_test set new_code=c->>'code',code_id=(c->>'code_id')::uuid;end $$;
reset role;
update private.student_access_codes set expires_at=clock_timestamp()-interval'1 minute'where id=(select code_id from access_test);
set local role service_role;
do $$declare allowed boolean;begin
 if public.student_code_consume('__ACCESS_STUDENT__',(select new_code from access_test))is not null then raise exception 'FAIL expired code';end if;
 for i in 1..11 loop allowed:=public.student_access_rate('__ACCESS_RATE_TEST__');end loop;if allowed then raise exception 'FAIL durable rate';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','21000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$begin begin perform public.student_code_issue('__ACCESS_STUDENT__','reset');raise exception 'FAIL teacher code issuance';exception when insufficient_privilege then null;end;end $$;
reset role;
-- A compromised/mixed staff link cannot be changed through student setup/reset.
update public.students set auth_user_id='21000000-0000-4000-8000-000000000001'where student_id='__ACCESS_STUDENT__';
select set_config('request.jwt.claim.sub','21000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin begin perform public.student_code_issue('__ACCESS_STUDENT__','reset');raise exception 'FAIL staff credential escalation';exception when raise_exception then if sqlerrm='FAIL staff credential escalation'then raise;end if;end;end $$;
reset role;
rollback;
