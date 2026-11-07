begin;
insert into auth.users(id)select('16000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,3)n;
insert into public.profiles(id,display_name,is_active)select('16000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'GRANT fixture '||n,true from generate_series(1,3)n on conflict(id)do update set is_active=true;
insert into public.user_roles(user_id,role)values('16000000-0000-4000-8000-000000000001','headmaster'),('16000000-0000-4000-8000-000000000002','discipline_officer'),('16000000-0000-4000-8000-000000000003','teacher');
insert into public.school_classes(class_name,grade,academic_year)values('__GRANT_CLASS__','S1','TEST');
insert into public.students(student_id,full_name,class_name,status,academic_score)values('__GRANT_STUDENT__','Original','__GRANT_CLASS__','Active',55);
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin
 if(public.roster_permission_state()->>'allowed')::boolean then raise exception 'FAIL default permission';end if;
 begin perform public.roster_preview('[{"student_id":"__GRANT_STUDENT__","full_name":"Updated","class_name":"__GRANT_CLASS__"}]');raise exception 'FAIL officer without grant';exception when insufficient_privilege then null;end;
 begin perform public.roster_grant_save(auth.uid(),true);raise exception 'FAIL self grant';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$declare a jsonb;b jsonb;begin a:=public.roster_grant_save('16000000-0000-4000-8000-000000000002',true);b:=public.roster_grant_save('16000000-0000-4000-8000-000000000002',true);if a->>'id'<>b->>'id'then raise exception 'FAIL duplicate permission';end if;begin perform public.roster_grant_save('16000000-0000-4000-8000-000000000003',true);raise exception 'FAIL teacher bulk permission';exception when raise_exception then if sqlerrm='FAIL teacher bulk permission'then raise;end if;end;end $$;
reset role;
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare rows jsonb:='[{"student_id":"__GRANT_STUDENT__","full_name":"Updated","class_name":"__GRANT_CLASS__"}]';p jsonb;r jsonb;begin
 p:=public.roster_preview(rows);
 if not(public.roster_permission_state()->>'allowed')::boolean then raise exception 'FAIL preview consumed permission';end if;
 begin perform public.roster_apply(rows,'stale','46000000-0000-4000-8000-000000000001');raise exception 'FAIL stale import';exception when serialization_failure then null;end;
 if not(public.roster_permission_state()->>'allowed')::boolean then raise exception 'FAIL validation consumed permission';end if;
 r:=public.roster_apply(rows,p->>'preview_token','46000000-0000-4000-8000-000000000002');
 if(public.roster_permission_state()->>'allowed')::boolean then raise exception 'FAIL permission not consumed';end if;
 if public.roster_apply(rows,p->>'preview_token','46000000-0000-4000-8000-000000000002')<>r then raise exception 'FAIL retry after consumed permission';end if;
 begin perform public.roster_apply(rows,p->>'preview_token','46000000-0000-4000-8000-000000000003');raise exception 'FAIL second successful import';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$begin
 if not exists(select 1 from public.students where student_id='__GRANT_STUDENT__'and full_name='Updated'and academic_score=55)then raise exception 'FAIL update preservation';end if;
 if not exists(select 1 from public.school_notifications where recipient_id='16000000-0000-4000-8000-000000000001'and action='roster_import_applied'and actor_id='16000000-0000-4000-8000-000000000002')then raise exception 'FAIL Headmaster notification';end if;
end $$;
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.roster_grant_save('16000000-0000-4000-8000-000000000002',true);
select public.roster_grant_save('16000000-0000-4000-8000-000000000002',false);
reset role;
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin if(public.roster_permission_state()->>'allowed')::boolean then raise exception 'FAIL revoked permission';end if;end $$;
reset role;
-- Competing roster change invalidates the old preview; a reviewed correction is safe.
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$declare rows jsonb:='[{"student_id":"__GRANT_STUDENT__","full_name":"Corrected spelling","class_name":"__GRANT_CLASS__"}]';p jsonb;begin
 p:=public.roster_preview(rows);
 perform public.school_operation('student_edit','{"student_id":"__GRANT_STUDENT__","full_name":"Another editor change","class_name":"__GRANT_CLASS__","status":"Active"}');
 begin perform public.roster_apply(rows,p->>'preview_token','46000000-0000-4000-8000-000000000004');raise exception 'FAIL overwritten competing edit';exception when serialization_failure then null;end;
 if(select full_name from public.students where student_id='__GRANT_STUDENT__')<>'Another editor change'then raise exception 'FAIL partial correction';end if;
 p:=public.roster_preview(rows);perform public.roster_apply(rows,p->>'preview_token','46000000-0000-4000-8000-000000000005');
 if(select academic_score from public.students where student_id='__GRANT_STUDENT__')<>55 then raise exception 'FAIL score changed during correction';end if;
end $$;
reset role;
rollback;
