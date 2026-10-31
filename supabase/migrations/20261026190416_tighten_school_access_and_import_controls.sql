create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Internal SECURITY DEFINER helpers are kept outside Supabase's exposed API schema.
alter function public.has_school_role(text[]) set schema private;
alter function public.ruhuka_has_role(text[]) set schema private;
alter function public.can_access_class(text) set schema private;
alter function public.can_access_student(text) set schema private;
alter function public.create_profile_for_auth_user() set schema private;
alter function public.audit_attendance_change() set schema private;
alter function public.apply_discipline_import(uuid) set schema private;

create or replace function private.ruhuka_has_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $function$ select private.has_school_role(allowed_roles); $function$;

create or replace function private.can_access_class(target_class text)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select private.has_school_role(array['headmaster','admin','dean','discipline_officer'])
      or exists (
        select 1 from public.teacher_class_assignments a
        where a.teacher_user_id = (select auth.uid())
          and a.class_name = target_class
      );
$function$;

create or replace function private.can_access_student(target_student_id text)
returns boolean language sql stable security definer set search_path = ''
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
  or private.has_school_role(array['headmaster','admin','dean','discipline_officer'])
  or exists (
    select 1 from public.students s
    join public.teacher_class_assignments a on a.class_name = s.class_name
    where s.student_id = target_student_id
      and a.teacher_user_id = (select auth.uid())
  );
$function$;

revoke all on function private.has_school_role(text[]) from public, anon;
revoke all on function private.ruhuka_has_role(text[]) from public, anon;
revoke all on function private.can_access_class(text) from public, anon;
revoke all on function private.can_access_student(text) from public, anon;
revoke all on function private.create_profile_for_auth_user() from public, anon, authenticated;
revoke all on function private.audit_attendance_change() from public, anon, authenticated;
grant execute on function private.has_school_role(text[]) to authenticated, service_role;
grant execute on function private.ruhuka_has_role(text[]) to authenticated, service_role;
grant execute on function private.can_access_class(text) to authenticated, service_role;
grant execute on function private.can_access_student(text) to authenticated, service_role;

-- The public RPC is an invoker wrapper. The guarded implementation is internal.
create or replace function private.apply_discipline_import(target_batch_id uuid)
returns void language plpgsql security definer set search_path = ''
as $function$
declare
  actor uuid := (select auth.uid());
  batch_row public.import_batches%rowtype;
begin
  if actor is null or not private.has_school_role(array['headmaster','admin','discipline_officer']) then
    raise exception 'Only an authorized discipline officer or administrator may apply this import';
  end if;

  select * into batch_row from public.import_batches where id = target_batch_id for update;
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

create or replace function public.apply_discipline_import(target_batch_id uuid)
returns void language plpgsql security invoker set search_path = ''
as $function$
begin
  perform private.apply_discipline_import(target_batch_id);
end;
$function$;
revoke all on function private.apply_discipline_import(uuid) from public, anon;
grant execute on function private.apply_discipline_import(uuid) to authenticated, service_role;
revoke all on function public.apply_discipline_import(uuid) from public, anon;
grant execute on function public.apply_discipline_import(uuid) to authenticated;

-- Fix nullable subject assignments: a teacher can have a class-wide assignment.
alter table public.teacher_class_assignments drop constraint if exists teacher_class_assignments_pkey;
alter table public.teacher_class_assignments add column if not exists id uuid not null default gen_random_uuid();
alter table public.teacher_class_assignments add constraint teacher_class_assignments_pkey primary key (id);
create unique index if not exists teacher_class_assignment_scope_unique
  on public.teacher_class_assignments(teacher_user_id, class_name, coalesce(subject, ''));

-- A teacher only sees and records attendance for assigned classes.
drop policy if exists classes_staff_read on public.school_classes;
create policy classes_staff_read on public.school_classes for select to authenticated
using (private.can_access_class(class_name) or private.has_school_role(array['teacher']) and exists (
  select 1 from public.teacher_class_assignments a
  where a.teacher_user_id = (select auth.uid()) and a.class_name = school_classes.class_name
));

drop policy if exists attendance_sessions_staff_insert on public.attendance_sessions;
create policy attendance_sessions_staff_insert on public.attendance_sessions for insert to authenticated
with check (
  private.has_school_role(array['headmaster','admin'])
  or (private.has_school_role(array['teacher']) and exists (
    select 1 from public.teacher_class_assignments a
    where a.teacher_user_id = (select auth.uid()) and a.class_name = attendance_sessions.class_name
  ))
);

drop policy if exists attendance_sessions_staff_update on public.attendance_sessions;
create policy attendance_sessions_staff_update on public.attendance_sessions for update to authenticated
using (
  private.has_school_role(array['headmaster','admin'])
  or (private.has_school_role(array['teacher']) and exists (
    select 1 from public.teacher_class_assignments a
    where a.teacher_user_id = (select auth.uid()) and a.class_name = attendance_sessions.class_name
  ))
)
with check (
  private.has_school_role(array['headmaster','admin'])
  or (private.has_school_role(array['teacher']) and exists (
    select 1 from public.teacher_class_assignments a
    where a.teacher_user_id = (select auth.uid()) and a.class_name = attendance_sessions.class_name
  ))
);

-- Prevent teachers from changing marks outside their assigned class/subject.
drop policy if exists academics_staff_update on public.academic_records;
create policy academics_staff_update on public.academic_records for update to authenticated
using (
  private.has_school_role(array['headmaster','admin','dean'])
  or exists (
    select 1 from public.students s
    join public.teacher_class_assignments a on a.class_name = s.class_name
    where s.student_id = academic_records.student_id
      and a.teacher_user_id = (select auth.uid())
      and (a.subject is null or a.subject = academic_records.subject)
  )
)
with check (
  private.has_school_role(array['headmaster','admin','dean'])
  or exists (
    select 1 from public.students s
    join public.teacher_class_assignments a on a.class_name = s.class_name
    where s.student_id = academic_records.student_id
      and a.teacher_user_id = (select auth.uid())
      and (a.subject is null or a.subject = academic_records.subject)
  )
);

-- Discipline officers can only correct the main daily record to present with an explanation.
create or replace function private.guard_discipline_attendance_correction()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  if private.has_school_role(array['discipline_officer'])
     and not private.has_school_role(array['headmaster','admin']) then
    if new.session_id is distinct from old.session_id
       or new.student_id is distinct from old.student_id
       or new.status <> 'present'
       or not new.excused_late_arrival
       or nullif(trim(new.arrival_note), '') is null
       or not exists (
         select 1 from public.attendance_sessions s
         where s.id = new.session_id and s.attendance_type = 'main'
       ) then
      raise exception 'Discipline staff may only mark a late-returning student present on main attendance with a reason';
    end if;
    new.arrival_recorded_by := (select auth.uid());
  end if;
  return new;
end;
$function$;
revoke all on function private.guard_discipline_attendance_correction() from public, anon, authenticated;
drop trigger if exists guard_discipline_attendance_correction on public.attendance_records;
create trigger guard_discipline_attendance_correction before update on public.attendance_records
for each row execute function private.guard_discipline_attendance_correction();

-- Fix generic audit trigger return paths and keep trigger-only code out of the API.
create or replace function private.audit_attendance_change()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
  actor uuid := (select auth.uid());
  target_entity text := case when tg_table_name = 'attendance_sessions' then 'attendance_session' else 'attendance_record' end;
  target_id text;
begin
  if tg_op = 'DELETE' then
    target_id := old.id::text;
  else
    target_id := new.id::text;
  end if;

  if actor is not null then
    insert into public.audit_events(actor_user_id, action, entity_type, entity_id, details)
    values (actor, lower(tg_op), target_entity, target_id,
      case when tg_table_name = 'attendance_records' then
        jsonb_build_object('student_id', case when tg_op = 'DELETE' then old.student_id else new.student_id end,
                           'status', case when tg_op = 'DELETE' then old.status else new.status end,
                           'attendance_type', (select s.attendance_type from public.attendance_sessions s
                             where s.id = case when tg_op = 'DELETE' then old.session_id else new.session_id end))
      else jsonb_build_object('class_name', case when tg_op = 'DELETE' then old.class_name else new.class_name end,
                              'attendance_date', case when tg_op = 'DELETE' then old.attendance_date else new.attendance_date end,
                              'attendance_type', case when tg_op = 'DELETE' then old.attendance_type else new.attendance_type end)
      end);
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

-- Imports cannot be marked applied by inserting a forged batch or by adding rows after application.
drop policy if exists import_batches_authorized_insert on public.import_batches;
create policy import_batches_authorized_insert on public.import_batches for insert to authenticated
with check (
  private.has_school_role(array['headmaster','admin','discipline_officer'])
  and created_by = (select auth.uid())
  and status = 'review'
  and applied_by is null
  and applied_at is null
  and import_type in ('students','academics','discipline')
);
drop policy if exists discipline_snapshots_importer_insert on public.discipline_import_snapshots;
create policy discipline_snapshots_importer_insert on public.discipline_import_snapshots for insert to authenticated
with check (
  private.has_school_role(array['headmaster','admin','discipline_officer'])
  and exists (select 1 from public.import_batches b
              where b.id = discipline_import_snapshots.batch_id
                and b.import_type = 'discipline' and b.status = 'review')
);
drop policy if exists discipline_rows_importer_insert on public.discipline_import_rows;
create policy discipline_rows_importer_insert on public.discipline_import_rows for insert to authenticated
with check (
  private.has_school_role(array['headmaster','admin','discipline_officer'])
  and exists (select 1 from public.import_batches b
              where b.id = discipline_import_rows.batch_id
                and b.import_type = 'discipline' and b.status = 'review')
);

-- Realtime views are computed from saved main-attendance rows, so totals cannot drift.
create or replace view public.main_attendance_stats
with (security_invoker = true)
as
select s.class_name,
       s.attendance_date,
       count(*) filter (where ar.status in ('present','late')) as present_count,
       count(*) filter (where ar.status = 'absent') as absent_count,
       count(*) filter (where ar.status = 'excused') as excused_absence_count,
       count(ar.id) as marked_count,
       (select count(*) from public.students st
        where st.class_name = s.class_name and st.status = 'Active') as active_student_count
from public.attendance_sessions s
left join public.attendance_records ar on ar.session_id = s.id
where s.attendance_type = 'main'
  and s.status in ('submitted','approved')
  and private.has_school_role(array['headmaster','admin','dean','discipline_officer','teacher'])
group by s.class_name, s.attendance_date;
grant select on public.main_attendance_stats to authenticated;

-- Preserve attendance, roster, grades, discipline and role changes for other sessions to refresh from.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['profiles','user_roles','students','school_classes','academic_records',
      'attendance_sessions','attendance_records','discipline_events','import_batches','parent_student_links']
    loop
      if not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

