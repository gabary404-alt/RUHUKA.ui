
create table public.school_terms(
 academic_year text not null,term_number integer not null check(term_number between 1 and 3),
 starts_on date not null,ends_on date not null check(ends_on>=starts_on),
 primary key(academic_year,term_number)
);
create table public.school_notifications(
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid not null references public.profiles(id),action text not null,target text not null,
 priority text not null default 'normal' check(priority in ('normal','high')),created_at timestamptz not null default now(),read_at timestamptz
);
create index school_notifications_recipient_idx on public.school_notifications(recipient_id,created_at desc);
create table public.school_announcements(
 id uuid primary key default gen_random_uuid(),author_id uuid not null default auth.uid() references public.profiles(id),
 title text not null check(length(btrim(title)) between 1 and 120),body text not null check(length(btrim(body)) between 1 and 5000),
 class_name text references public.school_classes(class_name),created_at timestamptz not null default now()
);
alter table public.school_terms enable row level security;
alter table public.school_notifications enable row level security;
alter table public.school_announcements enable row level security;
revoke all on public.school_terms,public.school_notifications,public.school_announcements from anon,authenticated;
grant select on public.school_terms,public.school_notifications,public.school_announcements to authenticated;
create policy school_terms_staff on public.school_terms for select to authenticated using(private.has_school_role(array['headmaster','dean','discipline_officer','teacher','discipline_staff','student']));
create policy own_school_notifications on public.school_notifications for select to authenticated using(recipient_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active));
create policy targeted_school_announcements on public.school_announcements for select to authenticated
using(private.has_school_role(array['headmaster','dean','discipline_officer','teacher','discipline_staff','student']) and
 (class_name is null or private.can_access_class(class_name) or exists(select 1 from public.students s where s.auth_user_id=auth.uid() and s.class_name=school_announcements.class_name and s.status='Active')));

create or replace function private.lock_roster_classes()
returns trigger language plpgsql security definer set search_path='' as $$
declare previous_class text;next_class text;
begin
 if tg_op<>'INSERT' then previous_class:=old.class_name; end if;
 if tg_op<>'DELETE' then next_class:=new.class_name; end if;
 perform 1 from public.school_classes where class_name in (previous_class,next_class) order by class_name for update;
 if tg_op='DELETE' then return old; end if;return new;
end;
$$;
revoke all on function private.lock_roster_classes() from public,anon,authenticated;
create trigger roster_class_locks before insert or update or delete on public.students for each row execute function private.lock_roster_classes();
revoke insert,update,delete on public.students,public.school_classes,public.teacher_class_assignments from authenticated,anon;
create policy student_change_validated_insert on public.workflow_items as restrictive for insert to authenticated with check(item_type<>'student_change');
create policy student_change_validated_update on public.workflow_items as restrictive for update to authenticated using(item_type<>'student_change') with check(item_type<>'student_change');

create or replace function private.school_operation(operation text,data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();head boolean:=private.has_school_role(array['headmaster']);dean boolean:=private.has_school_role(array['dean']);
 officer boolean:=private.has_school_role(array['discipline_officer']);result uuid;old_row jsonb;new_row jsonb;student text;class text;name text;state text;target_user uuid;start_date date;end_date date;year text;term integer;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if data is null or jsonb_typeof(data)<>'object' then raise exception 'Invalid request';end if;
 if operation='class_create' then
  if not head then raise exception 'Headmaster access required' using errcode='42501';end if;
  class:=btrim(data->>'class_name');year:=btrim(data->>'academic_year');
  if coalesce(length(class),0) not between 1 and 80 or coalesce(length(year),0) not between 1 and 30 or coalesce(data->>'grade','') not in ('S1','S2','S3','S4','S5','S6') then raise exception 'Provide class name, grade S1–S6 and school year';end if;
  insert into public.school_classes(class_name,grade,stream,academic_year) values(class,data->>'grade',nullif(btrim(data->>'stream'),''),year);
 elsif operation='term_save' then
  if not head then raise exception 'Headmaster access required' using errcode='42501';end if;
  year:=btrim(data->>'academic_year');term:=(data->>'term_number')::integer;start_date:=(data->>'starts_on')::date;end_date:=(data->>'ends_on')::date;
  if coalesce(length(year),0) not between 1 and 30 or term not between 1 and 3 or start_date is null or end_date is null or start_date>end_date then raise exception 'Provide year, term 1–3 and valid dates';end if;
  perform pg_advisory_xact_lock(hashtextextended('school-terms:'||year,0));
  if exists(select 1 from public.school_terms t where t.academic_year=year and t.term_number<>term and daterange(t.starts_on,t.ends_on,'[]')&&daterange(start_date,end_date,'[]')) then raise exception 'Term dates overlap';end if;
  insert into public.school_terms values(year,term,start_date,end_date) on conflict(academic_year,term_number) do update set starts_on=excluded.starts_on,ends_on=excluded.ends_on;
 elsif operation='teacher_assign' then
  if not (head or dean) then raise exception 'Headmaster or Dean access required' using errcode='42501';end if;
  target_user:=(data->>'teacher_user_id')::uuid;class:=data->>'class_name';
  if not exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id where r.user_id=target_user and r.role='teacher' and p.is_active) then raise exception 'Choose an active teacher account';end if;
  perform 1 from public.school_classes where class_name=class for update;if not found then raise exception 'Class not found';end if;
  if coalesce((data->>'enabled')::boolean,true) then
   if not exists(select 1 from public.teacher_class_assignments a where a.teacher_user_id=target_user and a.class_name=class and a.subject is null) then
    insert into public.teacher_class_assignments(teacher_user_id,class_name,created_by) values(target_user,class,actor);end if;
  else delete from public.teacher_class_assignments where teacher_user_id=target_user and class_name=class;end if;
 elsif operation in ('student_add','student_edit') then
  if operation='student_add' and not(head or officer) then raise exception 'Headmaster or Discipline Officer access required' using errcode='42501';end if;
  if operation='student_edit' and not head then raise exception 'Headmaster access required' using errcode='42501';end if;
  student:=btrim(data->>'student_id');name:=btrim(data->>'full_name');class:=data->>'class_name';state:=coalesce(data->>'status','Active');
  if coalesce(length(student),0) not between 1 and 60 or coalesce(length(name),0) not between 1 and 160 or state not in ('Active','Archived','Transferred','Graduated') then raise exception 'Provide student ID, name and valid status';end if;
  if not exists(select 1 from public.school_classes where class_name=class) then raise exception 'Class not found';end if;
  if operation='student_add' then
   insert into public.students(student_id,full_name,class_name,status) values(student,name,class,state);
   if officer and not head then
    insert into public.school_notifications(recipient_id,actor_id,action,target,priority)
    select distinct r.user_id,actor,'student_added',student,'high' from public.user_roles r join public.profiles p on p.id=r.user_id where r.role='headmaster' and p.is_active;
   end if;
  else
   select to_jsonb(s) into old_row from public.students s where student_id=student;
   update public.students set full_name=name,class_name=class,status=state where student_id=student;
   if not found then raise exception 'Student not found';end if;
  end if;
  select to_jsonb(s) into new_row from public.students s where student_id=student;
 elsif operation='student_change_request' then
  if not officer then raise exception 'Discipline Officer access required' using errcode='42501';end if;
  student:=data->>'student_id';if not exists(select 1 from public.students where student_id=student) or coalesce(length(btrim(data->>'request')),0) not between 1 and 1000 then raise exception 'Choose a student and describe requested corrections';end if;
  insert into public.workflow_items(item_type,student_id,requested_by,payload) values('student_change',student,actor,jsonb_build_object('request',btrim(data->>'request'))) returning id into result;
  insert into public.school_notifications(recipient_id,actor_id,action,target)
  select distinct r.user_id,actor,'student_change_requested',result::text from public.user_roles r join public.profiles p on p.id=r.user_id where r.role='headmaster' and p.is_active;
 elsif operation='announcement_publish' then
  class:=nullif(data->>'class_name','');
  if not(head or dean or officer) and not(private.has_school_role(array['teacher']) and class is not null and exists(select 1 from public.teacher_class_assignments a where a.teacher_user_id=actor and a.class_name=class)) then raise exception 'Publish only within your announcement permission' using errcode='42501';end if;
  insert into public.school_announcements(author_id,title,body,class_name) values(actor,btrim(data->>'title'),btrim(data->>'body'),class) returning id into result;
 elsif operation='notification_read' then
  if not exists(select 1 from public.profiles where id=actor and is_active) then raise exception 'Active account required' using errcode='42501';end if;
  update public.school_notifications set read_at=coalesce(read_at,now()) where id=(data->>'id')::uuid and recipient_id=actor;
  if not found then raise exception 'Notification not found';end if;
 else raise exception 'Unknown school operation';end if;
 if operation<>'notification_read' then
  insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)
  values(actor,operation,'school_operation',coalesce(result::text,student,class,year),jsonb_build_object('before',old_row,'after',new_row,'request',data));
 end if;
 return jsonb_build_object('id',result,'saved',true);
end;
$$;
revoke all on function private.school_operation(text,jsonb) from public,anon;
grant execute on function private.school_operation(text,jsonb) to authenticated;
create or replace function public.school_operation(operation text,data jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select private.school_operation(operation,data); $$;
revoke all on function public.school_operation(text,jsonb) from public,anon;
grant execute on function public.school_operation(text,jsonb) to authenticated;
