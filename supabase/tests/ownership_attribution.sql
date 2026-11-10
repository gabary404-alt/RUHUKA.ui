begin;
insert into auth.users(id,email,email_confirmed_at)
values ('51000000-0000-4000-8000-000000000001','former-owner@example.invalid',now()),
       ('51000000-0000-4000-8000-000000000002','successor-owner@example.invalid',now());
insert into public.profiles(id,display_name,is_active)
values ('51000000-0000-4000-8000-000000000001','Synthetic former Headmaster',true),
       ('51000000-0000-4000-8000-000000000002','Synthetic successor Headmaster',true)
on conflict(id) do update set display_name=excluded.display_name,is_active=true;
insert into public.user_roles(user_id,role,granted_by)
values ('51000000-0000-4000-8000-000000000001','headmaster',null),
       ('51000000-0000-4000-8000-000000000002','headmaster','51000000-0000-4000-8000-000000000001');
insert into auth.sessions(id,user_id,created_at,updated_at)
values ('51000000-0000-4000-8000-000000000011','51000000-0000-4000-8000-000000000001',now(),now()),
       ('51000000-0000-4000-8000-000000000022','51000000-0000-4000-8000-000000000002',now(),now());

select set_config('request.jwt.claims','{"sub":"51000000-0000-4000-8000-000000000001","session_id":"51000000-0000-4000-8000-000000000011"}',true);
set local role authenticated;
select public.school_operation('announcement_publish','{"title":"__OWNERSHIP_QA__","body":"Synthetic history"}');
reset role;

-- Operator-only retirement after the separately authenticated successor is
-- verified. Retain the historical profile, Auth identity and role attribution.
update public.profiles set is_active=false where id='51000000-0000-4000-8000-000000000001';
update auth.sessions set not_after=now() where user_id='51000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$begin
 if private.has_school_role(array['headmaster']) then raise exception 'Retired owner still has access';end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"51000000-0000-4000-8000-000000000002","session_id":"51000000-0000-4000-8000-000000000022"}',true);
set local role authenticated;
do $$begin
 if not private.has_school_role(array['headmaster']) then raise exception 'Successor owner lacks access';end if;
 if not exists(select 1 from public.school_announcements where title='__OWNERSHIP_QA__'
    and author_id='51000000-0000-4000-8000-000000000001') then raise exception 'Announcement attribution changed';end if;
 if not exists(select 1 from public.audit_events where actor_user_id='51000000-0000-4000-8000-000000000001'
    and action='announcement_publish') then raise exception 'Original audit actor lost';end if;
end $$;
reset role;
rollback;
