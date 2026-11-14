-- Disposable, non-login fixtures for two real transaction races. Run cleanup afterwards.
begin;
do $$begin if exists(select 1 from auth.users where id::text like'17000000-%')or exists(select 1 from public.school_classes where class_name='__ROSTER_RACE_CLASS__')then raise exception 'Concurrency fixture already exists; inspect before continuing';end if;end $$;
insert into auth.users(id)values('17000000-0000-4000-8000-000000000001'),('17000000-0000-4000-8000-000000000002');
insert into public.profiles(id,display_name,is_active)values('17000000-0000-4000-8000-000000000001','ROSTER RACE synthetic Headmaster',true),('17000000-0000-4000-8000-000000000002','ROSTER RACE synthetic Officer',true)on conflict(id)do update set is_active=true;
insert into public.user_roles(user_id,role)values('17000000-0000-4000-8000-000000000001','headmaster'),('17000000-0000-4000-8000-000000000002','discipline_officer');
insert into public.school_classes(class_name,grade,academic_year)values('__ROSTER_RACE_CLASS__','S1','TEST');
insert into public.students(student_id,full_name,class_name,status)values('__ROSTER_RACE_STUDENT__','Original','__ROSTER_RACE_CLASS__','Active');
select set_config('request.jwt.claim.sub','17000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.roster_grant_save('17000000-0000-4000-8000-000000000002',true);
reset role;
commit;
