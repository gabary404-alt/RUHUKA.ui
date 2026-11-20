-- Run against the isolated test database with the staff deletion migration installed.
begin;

do $test$
declare
 head_id uuid := gen_random_uuid();
 staff_id uuid := gen_random_uuid();
 student_id uuid := gen_random_uuid();
 other_head uuid := gen_random_uuid();
 session_id uuid := gen_random_uuid();
begin
 insert into auth.users(id,email) select id, id::text || '@example.test'
 from unnest(array[head_id,staff_id,student_id,other_head]) as fixture(id);
 insert into public.profiles(id,display_name,is_active)
 values (head_id,'Delete test head',true),(staff_id,'Delete test teacher',true),
        (student_id,'Delete test student',true),(other_head,'Delete test second head',true)
 on conflict(id) do update set is_active=excluded.is_active;
 insert into public.user_roles(user_id,role,granted_by)
 values (head_id,'headmaster',head_id),(staff_id,'teacher',head_id),
        (student_id,'student',head_id),(other_head,'headmaster',head_id);
 insert into auth.sessions(id,user_id,not_after) values(session_id,staff_id,now()+interval '1 day');
 insert into private.roster_import_grants(beneficiary_id,granted_by) values(staff_id,head_id);
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)
 values(staff_id,'delete_fixture_history','staff_account',staff_id::text,'{}');
 if has_function_privilege('anon','public.staff_account_delete(uuid)','execute') then
   raise exception 'Anonymous callers received execute permission';
 end if;
 perform set_config('request.jwt.claim.sub',staff_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'session_id',session_id)::text,true);
 if not private.has_school_role(array['teacher']) then raise exception 'Fixture teacher lacks access'; end if;
 begin
  perform public.staff_account_delete(staff_id);
  raise exception 'Teacher delete succeeded';
 exception when insufficient_privilege then null;
 end;
 perform set_config('request.jwt.claim.sub',head_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',head_id)::text,true);
 if not (public.staff_directory() @> jsonb_build_array(jsonb_build_object('id',staff_id,'can_delete',true))) then
   raise exception 'Staff account did not show the delete option';
 end if;
 begin
   perform public.staff_account_delete(head_id);
   raise exception 'Self deletion succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
   perform public.staff_account_delete(other_head);
   raise exception 'Headmaster deletion succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
   perform public.staff_account_delete(student_id);
   raise exception 'Student deletion succeeded';
 exception when insufficient_privilege then null;
 end;
 if public.staff_account_delete(staff_id) <> '{"deleted":true}'::jsonb then raise exception 'Delete result missing'; end if;
 perform public.staff_account_delete(staff_id);
 if public.staff_directory() @> jsonb_build_array(jsonb_build_object('id',staff_id)) then raise exception 'Deleted account still listed'; end if;
 if exists(select from public.user_roles where user_id=staff_id) then raise exception 'Staff roles were retained'; end if;
 if exists(select from private.roster_import_grants where beneficiary_id=staff_id and revoked_at is null) then raise exception 'Roster grant still valid'; end if;
 if not exists(select from auth.sessions s where s.id=session_id and s.not_after<=now()) then raise exception 'Staff session still valid'; end if;
 if not exists(select from auth.users where id=staff_id) or not exists(select from public.audit_events where actor_user_id=staff_id and action='delete_fixture_history') then raise exception 'Historical attribution lost'; end if;
 if (select count(*) from public.audit_events where action='staff_account_deleted' and entity_id=staff_id::text) <> 1 then raise exception 'Duplicate or missing audit entry'; end if;
 begin
   perform public.staff_account_save(staff_id,'Delete test teacher',array['teacher'],true);
   raise exception 'Reactivating deleted staff succeeded';
 exception when check_violation then null;
 end;
 perform set_config('request.jwt.claim.sub',staff_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'session_id',session_id)::text,true);
 if private.has_school_role(array['teacher']) then raise exception 'Deleted staff can still act as teacher'; end if;
end
$test$;

select 'Staff delete passed' as result;
rollback;
