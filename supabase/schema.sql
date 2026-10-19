create extension if not exists pgcrypto;

create table if not exists public.school_classes (
  class_name text primary key,
  grade text not null,
  stream text,
  academic_year text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  student_id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  gender text check (gender in ('M', 'F', 'Other')),
  class_name text references public.school_classes(class_name) on update cascade,
  grade text,
  stream text,
  level text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  academic_score numeric(5,2) check (academic_score between 0 and 100),
  academic_term text,
  official_discipline_points numeric(5,2) check (official_discipline_points between 0 and 40),
  discipline_snapshot_date date,
  attendance_rate numeric(5,2) check (attendance_rate between 0 and 100),
  absences integer not null default 0 check (absences >= 0),
  status text not null default 'Active' check (status in ('Active', 'Transferred', 'Graduated', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  import_type text not null check (import_type in ('students', 'academics', 'discipline')),
  status text not null default 'review' check (status in ('review', 'applied', 'approved', 'rejected', 'failed')),
  source_filename text,
  row_count integer not null default 0,
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  review_note text,
  verification_reference text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.import_batches
  add column if not exists verification_reference text;

alter table public.import_batches
  drop constraint if exists discipline_imports_require_review_evidence;
alter table public.import_batches
  add constraint discipline_imports_require_review_evidence
  check (
    import_type <> 'discipline'
    or status <> 'approved'
    or (
      reviewed_by is not null
      and reviewed_at is not null
      and nullif(btrim(review_note), '') is not null
      and nullif(btrim(verification_reference), '') is not null
    )
  );

alter table public.students
  add column if not exists discipline_snapshot_batch_id uuid;
alter table public.students
  drop constraint if exists students_discipline_snapshot_batch_id_fkey;
alter table public.students
  add constraint students_discipline_snapshot_batch_id_fkey
  foreign key (discipline_snapshot_batch_id) references public.import_batches(id);

create table if not exists public.academic_records (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id),
  term text not null,
  subject text not null,
  score numeric(7,2) not null check (score >= 0),
  maximum_score numeric(7,2) not null check (maximum_score > 0 and score <= maximum_score),
  recorded_on date not null default current_date,
  import_batch_id uuid references public.import_batches(id),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (student_id, term, subject)
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_name text not null references public.school_classes(class_name),
  attendance_date date not null,
  period text not null,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  submitted_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (class_name, attendance_date, period)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id text not null references public.students(student_id),
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table if not exists public.discipline_events (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id),
  event_date date not null,
  official_total numeric(5,2) check (official_total between 0 and 40),
  reported_change numeric(5,2),
  reason text not null,
  recorded_by uuid references auth.users(id),
  source text not null,
  import_batch_id uuid references public.import_batches(id),
  verification_status text not null default 'reported' check (verification_status in ('reported', 'imported', 'verified')),
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('absence_justification', 'import_review', 'student_change')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  student_id text references public.students(student_id),
  requested_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  decision_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.has_school_role(allowed_roles text[])
returns boolean
language sql
stable
security invoker
set search_path = public, auth
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'school_role', '') = any (allowed_roles);
$$;

create or replace function public.guard_official_discipline_total()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.official_discipline_points is not null then
    raise exception 'Official discipline totals must be applied from a reviewed discipline import';
  end if;

  if tg_op = 'UPDATE'
    and new.official_discipline_points is distinct from old.official_discipline_points then
    if new.discipline_snapshot_batch_id is null
      or not exists (
        select 1
        from public.import_batches b
        join public.discipline_events e
          on e.import_batch_id = b.id
         and e.student_id = new.student_id
         and e.official_total = new.official_discipline_points
         and e.verification_status = 'verified'
        where b.id = new.discipline_snapshot_batch_id
          and b.import_type = 'discipline'
          and b.status = 'approved'
          and b.reviewed_by is not null
          and nullif(btrim(b.review_note), '') is not null
          and nullif(btrim(b.verification_reference), '') is not null
      ) then
      raise exception 'Official discipline totals require a matching verified event in an approved import batch';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists students_guard_official_discipline_total on public.students;
create trigger students_guard_official_discipline_total
before insert or update of official_discipline_points on public.students
for each row execute function public.guard_official_discipline_total();

create or replace function public.guard_verified_discipline_event()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.official_total is not null and (
    new.import_batch_id is null
    or new.verification_status <> 'verified'
    or not exists (
      select 1
      from public.import_batches b
      where b.id = new.import_batch_id
        and b.import_type = 'discipline'
        and b.status = 'approved'
        and b.reviewed_by is not null
        and nullif(btrim(b.review_note), '') is not null
        and nullif(btrim(b.verification_reference), '') is not null
    )
  ) then
    raise exception 'Official discipline totals require a verified event in an approved import batch';
  end if;

  return new;
end;
$$;

drop trigger if exists discipline_events_guard_verified_total on public.discipline_events;
create trigger discipline_events_guard_verified_total
before insert or update of official_total, import_batch_id, verification_status on public.discipline_events
for each row execute function public.guard_verified_discipline_event();

alter table public.school_classes enable row level security;
alter table public.students enable row level security;
alter table public.import_batches enable row level security;
alter table public.academic_records enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.discipline_events enable row level security;
alter table public.workflow_items enable row level security;
alter table public.audit_events enable row level security;

create policy "staff can read classes" on public.school_classes for select to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'teacher', 'discipline_officer', 'dean']));
create policy "admins manage classes" on public.school_classes for all to authenticated
using (public.has_school_role(array['headmaster', 'admin']))
with check (public.has_school_role(array['headmaster', 'admin']));

create policy "staff and linked student read student record" on public.students for select to authenticated
using (auth_user_id = auth.uid() or public.has_school_role(array['headmaster', 'admin', 'teacher', 'discipline_officer', 'dean']));
create policy "admins manage students" on public.students for all to authenticated
using (public.has_school_role(array['headmaster', 'admin']))
with check (public.has_school_role(array['headmaster', 'admin']));

create policy "admins read import batches" on public.import_batches for select to authenticated
using (public.has_school_role(array['headmaster', 'admin']));
create policy "admins create import batches" on public.import_batches for insert to authenticated
with check (created_by = auth.uid() and public.has_school_role(array['headmaster', 'admin']));
create policy "admins review import batches" on public.import_batches for update to authenticated
using (public.has_school_role(array['headmaster', 'admin']))
with check (public.has_school_role(array['headmaster', 'admin']));

create policy "staff and linked student read academic records" on public.academic_records for select to authenticated
using (exists (select 1 from public.students s where s.student_id = academic_records.student_id and (s.auth_user_id = auth.uid() or public.has_school_role(array['headmaster', 'admin', 'teacher', 'dean']))));
create policy "academic staff manage results" on public.academic_records for all to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'dean']))
with check (public.has_school_role(array['headmaster', 'admin', 'dean']));

create policy "staff and linked student read attendance sessions" on public.attendance_sessions for select to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'teacher', 'discipline_officer']) or exists (select 1 from public.attendance_records ar join public.students s using (student_id) where ar.session_id = attendance_sessions.id and s.auth_user_id = auth.uid()));
create policy "teachers submit attendance" on public.attendance_sessions for insert to authenticated
with check (submitted_by = auth.uid() and public.has_school_role(array['headmaster', 'admin', 'teacher']));
create policy "admins review attendance" on public.attendance_sessions for update to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'discipline_officer']))
with check (public.has_school_role(array['headmaster', 'admin', 'discipline_officer']));

create policy "staff and linked student read attendance records" on public.attendance_records for select to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'teacher', 'discipline_officer']) or exists (select 1 from public.students s where s.student_id = attendance_records.student_id and s.auth_user_id = auth.uid()));
create policy "teachers record attendance" on public.attendance_records for all to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'teacher']))
with check (public.has_school_role(array['headmaster', 'admin', 'teacher']));

create policy "staff and linked student read discipline events" on public.discipline_events for select to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'discipline_officer', 'dean']) or exists (select 1 from public.students s where s.student_id = discipline_events.student_id and s.auth_user_id = auth.uid()));
create policy "discipline staff append events" on public.discipline_events for insert to authenticated
with check (public.has_school_role(array['headmaster', 'admin', 'discipline_officer']));

create policy "workflow parties and admins read requests" on public.workflow_items for select to authenticated
using (requested_by = auth.uid() or public.has_school_role(array['headmaster', 'admin', 'discipline_officer', 'dean']));
create policy "authenticated users submit workflow requests" on public.workflow_items for insert to authenticated
with check (requested_by = auth.uid());
create policy "authorized staff decide workflow requests" on public.workflow_items for update to authenticated
using (public.has_school_role(array['headmaster', 'admin', 'discipline_officer', 'dean']))
with check (reviewed_by = auth.uid() and public.has_school_role(array['headmaster', 'admin', 'discipline_officer', 'dean']));

create policy "admins read audit events" on public.audit_events for select to authenticated
using (public.has_school_role(array['headmaster', 'admin']));
create policy "staff append own audit events" on public.audit_events for insert to authenticated
with check (actor_user_id = auth.uid() and public.has_school_role(array['headmaster', 'admin', 'teacher', 'discipline_officer', 'dean']));

create index if not exists students_class_status_idx on public.students (class_name, status);
create index if not exists attendance_date_class_idx on public.attendance_sessions (attendance_date, class_name);
create index if not exists attendance_student_session_idx on public.attendance_records (student_id, session_id);
create index if not exists discipline_student_date_idx on public.discipline_events (student_id, event_date desc);
create index if not exists academic_student_term_idx on public.academic_records (student_id, term);
create index if not exists workflow_status_created_idx on public.workflow_items (status, created_at desc);
create index if not exists audit_created_at_idx on public.audit_events (created_at desc);
