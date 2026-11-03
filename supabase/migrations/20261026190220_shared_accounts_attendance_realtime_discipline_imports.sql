-- Expand Ruhuka's existing schema for shared accounts, protected school records,
-- attendance statistics, and controlled monthly discipline imports.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('headmaster','admin','dean','discipline_officer','teacher','student','parent')),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.teacher_class_assignments (
  teacher_user_id uuid not null references public.profiles(id) on delete cascade,
  class_name text not null references public.school_classes(class_name) on update cascade,
  subject text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (teacher_user_id, class_name, subject)
);

create table if not exists public.parent_student_links (
  parent_user_id uuid not null references public.profiles(id) on delete cascade,
  student_id text not null references public.students(student_id) on update cascade on delete cascade,
  relationship text,
  linked_by uuid references public.profiles(id),
  linked_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (parent_user_id, student_id)
);

create table if not exists public.student_private_contacts (
  student_id text primary key references public.students(student_id) on update cascade on delete cascade,
  student_email text,
  student_phone text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  updated_at timestamptz not null default now()
);

-- Keep contact details out of the student row that students and parents can read.
insert into public.student_private_contacts
  (student_id, student_email, student_phone, guardian_name, guardian_phone, guardian_email)
select student_id, student_email, student_phone, guardian_name, guardian_phone, guardian_email
from public.students
where student_email is not null or student_phone is not null or guardian_name is not null
   or guardian_phone is not null or guardian_email is not null
on conflict (student_id) do update set
  student_email = excluded.student_email,
  student_phone = excluded.student_phone,
  guardian_name = excluded.guardian_name,
  guardian_phone = excluded.guardian_phone,
  guardian_email = excluded.guardian_email,
  updated_at = now();

alter table public.students drop column if exists student_email;
alter table public.students drop column if exists student_phone;
alter table public.students drop column if exists guardian_name;
alter table public.students drop column if exists guardian_phone;
alter table public.students drop column if exists guardian_email;

alter table public.attendance_sessions
  add column if not exists attendance_type text not null default 'main';
alter table public.attendance_sessions
  add column if not exists submitted_at timestamptz;
alter table public.attendance_records
  add column if not exists excused_late_arrival boolean not null default false;
alter table public.attendance_records
  add column if not exists arrival_note text;
alter table public.attendance_records
  add column if not exists arrival_recorded_by uuid references public.profiles(id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_sessions_type_check'
                 and conrelid = 'public.attendance_sessions'::regclass) then
    alter table public.attendance_sessions add constraint attendance_sessions_type_check
      check (attendance_type in ('main','period_followup'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'attendance_late_arrival_check'
                 and conrelid = 'public.attendance_records'::regclass) then
    alter table public.attendance_records add constraint attendance_late_arrival_check
      check (not excused_late_arrival or (status = 'present' and arrival_note is not null));
  end if;
end $$;

create unique index if not exists attendance_one_main_per_class_day
  on public.attendance_sessions(class_name, attendance_date)
  where attendance_type = 'main';
create unique index if not exists attendance_one_followup_period_per_class_day
  on public.attendance_sessions(class_name, attendance_date, period)
  where attendance_type = 'period_followup';
create unique index if not exists attendance_one_student_per_session
  on public.attendance_records(session_id, student_id);
create index if not exists parent_student_links_student_idx on public.parent_student_links(student_id);
create index if not exists teacher_class_assignments_class_idx on public.teacher_class_assignments(class_name);

alter table public.import_batches
  add column if not exists applied_by uuid references public.profiles(id);
alter table public.import_batches
  add column if not exists applied_at timestamptz;

alter table public.discipline_events
  add column if not exists source_recorded_by text;

create table if not exists public.discipline_import_snapshots (
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  student_id text not null references public.students(student_id) on update cascade,
  official_total numeric not null check (official_total between 0 and 40),
  snapshot_date date not null default current_date,
  primary key (batch_id, student_id)
);

create table if not exists public.discipline_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  student_id text not null references public.students(student_id) on update cascade,
  source_event_key text,
  event_date date not null,
  points_change numeric not null,
  reason text not null check (length(trim(reason)) > 0),
  source_recorded_by text,
  validation_errors jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_errors) = 'array'),
  created_at timestamptz not null default now(),
  unique (batch_id, source_event_key)
);

create index if not exists discipline_snapshots_student_date_idx
  on public.discipline_import_snapshots(student_id, snapshot_date desc);
create index if not exists discipline_import_rows_batch_idx
  on public.discipline_import_rows(batch_id);
create index if not exists discipline_events_student_date_idx
  on public.discipline_events(student_id, event_date desc);

create or replace function public.has_school_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and ur.role = any (allowed_roles)
      and p.is_active
  );
$function$;

create or replace function public.ruhuka_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.has_school_role(allowed_roles);
$function$;

create or replace function public.can_access_class(target_class text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.has_school_role(array['headmaster','admin','dean','discipline_officer'])
      or exists (
        select 1 from public.teacher_class_assignments a
        where a.teacher_user_id = (select auth.uid())
          and a.class_name = target_class
      );
$function$;

create or replace function public.can_access_student(target_student_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.students s
    where s.student_id = target_student_id
      and s.auth_user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.parent_student_links l
    where l.student_id = target_student_id
      and l.parent_user_id = (select auth.uid())
      and l.is_active
  )
  or public.has_school_role(array['headmaster','admin','dean','discipline_officer'])
  or exists (
    select 1 from public.students s
    join public.teacher_class_assignments a on a.class_name = s.class_name
    where s.student_id = target_student_id
      and a.teacher_user_id = (select auth.uid())
  );
$function$;

revoke all on function public.has_school_role(text[]) from public, anon;
revoke all on function public.ruhuka_has_role(text[]) from public, anon;
revoke all on function public.can_access_class(text) from public, anon;
revoke all on function public.can_access_student(text) from public, anon;
grant execute on function public.has_school_role(text[]) to authenticated, service_role;
grant execute on function public.ruhuka_has_role(text[]) to authenticated, service_role;
grant execute on function public.can_access_class(text) to authenticated, service_role;
grant execute on function public.can_access_student(text) to authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles(id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists student_private_contacts_set_updated_at on public.student_private_contacts;
create trigger student_private_contacts_set_updated_at before update on public.student_private_contacts
for each row execute function public.set_updated_at();

-- A discipline total can only come from a successfully applied official import.
create or replace function public.guard_official_discipline_total()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if (tg_op = 'INSERT' and new.official_discipline_points is not null)
     or (tg_op = 'UPDATE' and new.official_discipline_points is distinct from old.official_discipline_points) then
    if new.discipline_snapshot_batch_id is null
       or not exists (
         select 1 from public.discipline_import_snapshots s
         join public.import_batches b on b.id = s.batch_id
         where s.batch_id = new.discipline_snapshot_batch_id
           and s.student_id = new.student_id
           and s.official_total = new.official_discipline_points
           and b.import_type = 'discipline'
           and b.status = 'applied'
           and b.applied_by is not null
       ) then
      raise exception 'Official discipline totals must come from an applied discipline import';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.guard_verified_discipline_event()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.official_total is not null and not exists (
    select 1 from public.discipline_import_snapshots s
    join public.import_batches b on b.id = s.batch_id
    where s.batch_id = new.import_batch_id
      and s.student_id = new.student_id
      and s.official_total = new.official_total
      and b.import_type = 'discipline'
      and b.status = 'applied'
      and b.applied_by is not null
  ) then
    raise exception 'Official discipline totals must come from an applied discipline import';
  end if;
  return new;
end;
$function$;

create or replace function public.apply_discipline_import(target_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid := (select auth.uid());
  batch_row public.import_batches%rowtype;
begin
  if actor is null or not public.has_school_role(array['headmaster','admin','discipline_officer']) then
    raise exception 'Only an authorized discipline officer or administrator may apply this import';
  end if;

  select * into batch_row
  from public.import_batches
  where id = target_batch_id
  for update;

  if not found or batch_row.import_type <> 'discipline' or batch_row.status <> 'review' then
    raise exception 'Import batch must be a discipline batch awaiting review';
  end if;

  if exists (
    select 1 from public.discipline_import_snapshots s
    left join public.students st on st.student_id = s.student_id
    where s.batch_id = target_batch_id and st.student_id is null
  ) or exists (
    select 1 from public.discipline_import_rows r
    left join public.students st on st.student_id = r.student_id
    where r.batch_id = target_batch_id
      and (st.student_id is null or r.validation_errors <> '[]'::jsonb)
  ) then
    raise exception 'Import contains unknown students or rows that failed validation';
  end if;

  if exists (
    select 1 from public.discipline_import_rows r
    left join public.discipline_import_snapshots s
      on s.batch_id = r.batch_id and s.student_id = r.student_id
    where r.batch_id = target_batch_id and s.student_id is null
  ) then
    raise exception 'Every imported discipline event must have a matching official total';
  end if;

  if not exists (select 1 from public.discipline_import_snapshots where batch_id = target_batch_id) then
    raise exception 'Import has no official student totals';
  end if;

  update public.import_batches
  set status = 'applied',
      applied_by = actor,
      applied_at = now(),
      row_count = (select count(*) from public.discipline_import_snapshots where batch_id = target_batch_id)
  where id = target_batch_id;

  insert into public.discipline_events
    (student_id, event_date, reported_change, reason, recorded_by, source,
     source_recorded_by, import_batch_id, verification_status)
  select r.student_id, r.event_date, r.points_change, r.reason, actor,
         'discipline_import', r.source_recorded_by, r.batch_id, 'verified'
  from public.discipline_import_rows r
  where r.batch_id = target_batch_id;

  update public.students st
  set official_discipline_points = s.official_total,
      discipline_snapshot_date = s.snapshot_date,
      discipline_snapshot_batch_id = s.batch_id
  from public.discipline_import_snapshots s
  where s.batch_id = target_batch_id and s.student_id = st.student_id;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, details)
  values (actor, 'discipline_import_applied', 'import_batch', target_batch_id::text,
          jsonb_build_object('students', (select count(*) from public.discipline_import_snapshots where batch_id = target_batch_id),
                             'events', (select count(*) from public.discipline_import_rows where batch_id = target_batch_id)));
end;
$function$;

revoke all on function public.apply_discipline_import(uuid) from public, anon;
grant execute on function public.apply_discipline_import(uuid) to authenticated, service_role;

create or replace function public.audit_attendance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid := (select auth.uid());
  target_entity text := case when tg_table_name = 'attendance_sessions' then 'attendance_session' else 'attendance_record' end;
  target_id text;
begin
  if actor is null then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then
    target_id := old.id::text;
  else
    target_id := new.id::text;
  end if;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, details)
  values (actor, lower(tg_op), target_entity, target_id,
          case when tg_table_name = 'attendance_records' then
            jsonb_build_object('student_id', coalesce(new.student_id, old.student_id),
                               'status', case when tg_op = 'DELETE' then old.status else new.status end,
                               'attendance_type', (select s.attendance_type from public.attendance_sessions s
                                                   where s.id = coalesce(new.session_id, old.session_id)))
          else jsonb_build_object('class_name', coalesce(new.class_name, old.class_name),
                                  'attendance_date', coalesce(new.attendance_date, old.attendance_date),
                                  'attendance_type', coalesce(new.attendance_type, old.attendance_type))
          end);
  return coalesce(new, old);
end;
$function$;

drop trigger if exists attendance_records_audit on public.attendance_records;
create trigger attendance_records_audit after insert or update or delete on public.attendance_records
for each row execute function public.audit_attendance_change();
drop trigger if exists attendance_sessions_audit on public.attendance_sessions;
create trigger attendance_sessions_audit after insert or update or delete on public.attendance_sessions
for each row execute function public.audit_attendance_change();

-- Replace the earlier role policies with a class- and family-aware access model.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','user_roles','teacher_class_assignments','parent_student_links',
        'student_private_contacts','students','school_classes','academic_records',
        'attendance_sessions','attendance_records','discipline_events','import_batches',
        'discipline_import_snapshots','discipline_import_rows','workflow_items','audit_events')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_class_assignments enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.student_private_contacts enable row level security;
alter table public.discipline_import_snapshots enable row level security;
alter table public.discipline_import_rows enable row level security;

create policy profile_self_or_admin_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.has_school_role(array['headmaster','admin']));
create policy profile_admin_insert on public.profiles for insert to authenticated
with check (public.has_school_role(array['headmaster','admin']));
create policy profile_admin_update on public.profiles for update to authenticated
using (public.has_school_role(array['headmaster','admin']))
with check (public.has_school_role(array['headmaster','admin']));

create policy user_roles_self_or_admin_read on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.has_school_role(array['headmaster','admin']));
create policy user_roles_admin_insert on public.user_roles for insert to authenticated
with check (public.has_school_role(array['headmaster','admin']));
create policy user_roles_admin_update on public.user_roles for update to authenticated
using (public.has_school_role(array['headmaster','admin']))
with check (public.has_school_role(array['headmaster','admin']));
create policy user_roles_admin_delete on public.user_roles for delete to authenticated
using (public.has_school_role(array['headmaster','admin']));

create policy teacher_assignments_self_or_admin_read on public.teacher_class_assignments for select to authenticated
using (teacher_user_id = (select auth.uid()) or public.has_school_role(array['headmaster','admin','dean']));
create policy teacher_assignments_admin_manage on public.teacher_class_assignments for all to authenticated
using (public.has_school_role(array['headmaster','admin','dean']))
with check (public.has_school_role(array['headmaster','admin','dean']));

create policy parent_links_self_or_admin_read on public.parent_student_links for select to authenticated
using (parent_user_id = (select auth.uid()) or public.has_school_role(array['headmaster','admin']));
create policy parent_links_admin_manage on public.parent_student_links for all to authenticated
using (public.has_school_role(array['headmaster','admin']))
with check (public.has_school_role(array['headmaster','admin']));

create policy private_contacts_admin_read on public.student_private_contacts for select to authenticated
using (public.has_school_role(array['headmaster','admin','discipline_officer']));
create policy private_contacts_admin_manage on public.student_private_contacts for all to authenticated
using (public.has_school_role(array['headmaster','admin']))
with check (public.has_school_role(array['headmaster','admin']));

create policy students_visible_to_linked_accounts_and_staff on public.students for select to authenticated
using (public.can_access_student(student_id));
create policy students_admin_insert on public.students for insert to authenticated
with check (public.has_school_role(array['headmaster','admin']));
create policy students_admin_update on public.students for update to authenticated
using (public.has_school_role(array['headmaster','admin']))
with check (public.has_school_role(array['headmaster','admin']));

create policy classes_staff_read on public.school_classes for select to authenticated
using (public.can_access_class(class_name) or public.has_school_role(array['teacher']));
create policy classes_admin_manage on public.school_classes for all to authenticated
using (public.has_school_role(array['headmaster','admin']))
with check (public.has_school_role(array['headmaster','admin']));

create policy academics_linked_read on public.academic_records for select to authenticated
using (public.can_access_student(student_id));
create policy academics_staff_insert on public.academic_records for insert to authenticated
with check (
  public.has_school_role(array['headmaster','admin','dean'])
  or exists (
    select 1 from public.students s
    join public.teacher_class_assignments a on a.class_name = s.class_name
    where s.student_id = academic_records.student_id
      and a.teacher_user_id = (select auth.uid())
      and (a.subject is null or a.subject = academic_records.subject)
  )
);
create policy academics_staff_update on public.academic_records for update to authenticated
using (public.has_school_role(array['headmaster','admin','dean']))
with check (public.has_school_role(array['headmaster','admin','dean']));

create policy attendance_sessions_visible on public.attendance_sessions for select to authenticated
using (
  public.can_access_class(class_name)
  or exists (
    select 1 from public.attendance_records ar
    where ar.session_id = attendance_sessions.id
      and public.can_access_student(ar.student_id)
  )
);
create policy attendance_sessions_staff_insert on public.attendance_sessions for insert to authenticated
with check (public.can_access_class(class_name) or public.has_school_role(array['teacher']));
create policy attendance_sessions_staff_update on public.attendance_sessions for update to authenticated
using (public.can_access_class(class_name) or public.has_school_role(array['teacher']))
with check (public.can_access_class(class_name) or public.has_school_role(array['teacher']));

create policy attendance_records_linked_read on public.attendance_records for select to authenticated
using (public.can_access_student(student_id));
create policy attendance_records_teacher_insert on public.attendance_records for insert to authenticated
with check (
  public.has_school_role(array['headmaster','admin'])
  or exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and public.can_access_class(s.class_name)
      and public.has_school_role(array['teacher'])
  )
);
create policy attendance_records_teacher_update on public.attendance_records for update to authenticated
using (
  public.has_school_role(array['headmaster','admin'])
  or exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and public.can_access_class(s.class_name)
      and public.has_school_role(array['teacher'])
  )
)
with check (
  public.has_school_role(array['headmaster','admin'])
  or exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and public.can_access_class(s.class_name)
      and public.has_school_role(array['teacher'])
  )
);
create policy discipline_staff_correct_main_attendance on public.attendance_records for update to authenticated
using (
  public.has_school_role(array['discipline_officer'])
  and exists (select 1 from public.attendance_sessions s where s.id = attendance_records.session_id and s.attendance_type = 'main')
)
with check (
  public.has_school_role(array['discipline_officer'])
  and status = 'present' and excused_late_arrival
  and exists (select 1 from public.attendance_sessions s where s.id = attendance_records.session_id and s.attendance_type = 'main')
);

create policy discipline_events_linked_read on public.discipline_events for select to authenticated
using (public.can_access_student(student_id));

create policy import_batches_authorized_read on public.import_batches for select to authenticated
using (public.has_school_role(array['headmaster','admin','discipline_officer']));
create policy import_batches_authorized_insert on public.import_batches for insert to authenticated
with check (
  public.has_school_role(array['headmaster','admin','discipline_officer'])
  and created_by = (select auth.uid())
  and import_type in ('students','academics','discipline')
);

create policy discipline_snapshots_importer_read on public.discipline_import_snapshots for select to authenticated
using (public.has_school_role(array['headmaster','admin','discipline_officer']));
create policy discipline_snapshots_importer_insert on public.discipline_import_snapshots for insert to authenticated
with check (public.has_school_role(array['headmaster','admin','discipline_officer']));
create policy discipline_rows_importer_read on public.discipline_import_rows for select to authenticated
using (public.has_school_role(array['headmaster','admin','discipline_officer']));
create policy discipline_rows_importer_insert on public.discipline_import_rows for insert to authenticated
with check (public.has_school_role(array['headmaster','admin','discipline_officer']));

create policy workflow_submit_own on public.workflow_items for insert to authenticated
with check (requested_by = (select auth.uid()));
create policy workflow_read_parties_and_staff on public.workflow_items for select to authenticated
using (
  requested_by = (select auth.uid())
  or public.has_school_role(array['headmaster','admin','discipline_officer','dean'])
  or (student_id is not null and public.can_access_student(student_id))
);
create policy workflow_staff_decide on public.workflow_items for update to authenticated
using (public.has_school_role(array['headmaster','admin','discipline_officer','dean']))
with check (public.has_school_role(array['headmaster','admin','discipline_officer','dean']));

create policy audit_admin_read on public.audit_events for select to authenticated
using (public.has_school_role(array['headmaster','admin']));
create policy audit_own_append on public.audit_events for insert to authenticated
with check (actor_user_id = (select auth.uid()));

revoke all on public.discipline_events from authenticated;
grant select on public.discipline_events to authenticated;
grant select, insert, update on public.profiles, public.user_roles,
  public.teacher_class_assignments, public.parent_student_links, public.student_private_contacts,
  public.discipline_import_snapshots, public.discipline_import_rows,
  public.students, public.school_classes, public.academic_records,
  public.attendance_sessions, public.attendance_records, public.import_batches,
  public.workflow_items, public.audit_events to authenticated;
revoke delete on public.profiles, public.teacher_class_assignments, public.parent_student_links,
  public.student_private_contacts, public.students, public.school_classes, public.academic_records,
  public.attendance_sessions, public.attendance_records, public.import_batches,
  public.workflow_items, public.audit_events from authenticated;
revoke update, delete on public.audit_events from authenticated;
revoke update, delete on public.discipline_import_snapshots, public.discipline_import_rows from authenticated;

create or replace view public.main_attendance_stats
with (security_invoker = true)
as
select s.class_name,
       s.attendance_date,
       count(*) filter (where ar.status = 'present' or ar.status = 'late') as present_count,
       count(*) filter (where ar.status = 'absent') as absent_count,
       count(*) filter (where ar.status = 'excused') as excused_absence_count,
       count(ar.id) as marked_count,
       (select count(*) from public.students st
        where st.class_name = s.class_name and st.status = 'Active') as active_student_count
from public.attendance_sessions s
left join public.attendance_records ar on ar.session_id = s.id
where s.attendance_type = 'main'
  and s.status in ('submitted','approved')
  and public.has_school_role(array['headmaster','admin','dean','discipline_officer','teacher'])
group by s.class_name, s.attendance_date;

grant select on public.main_attendance_stats to authenticated;

-- Postgres Changes can notify authorized sessions; RLS remains the access control.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['profiles','user_roles','students','school_classes','academic_records',
      'attendance_sessions','attendance_records','discipline_events','import_batches','parent_student_links']
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- This event-trigger function is only for DDL automation and must not be an API RPC.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

