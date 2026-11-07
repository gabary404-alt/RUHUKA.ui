-- Deletes only the fixtures and events created by roster_concurrency_setup.sql/races.
begin;
delete from private.roster_import_grants where beneficiary_id='17000000-0000-4000-8000-000000000002';
delete from public.school_notifications where actor_id in('17000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000002');
delete from public.audit_events where actor_user_id in('17000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000002');
delete from private.roster_import_receipts where actor_id in('17000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000002');
delete from public.students where student_id='__ROSTER_RACE_STUDENT__'and class_name='__ROSTER_RACE_CLASS__';
delete from public.school_classes where class_name='__ROSTER_RACE_CLASS__';
delete from public.user_roles where user_id in('17000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000002');
delete from auth.users where id in('17000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000002')and email is null and encrypted_password is null;
commit;
