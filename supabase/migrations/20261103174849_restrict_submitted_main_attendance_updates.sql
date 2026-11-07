-- Add restrictive guards without replacing existing permissive policies.
create policy submitted_main_records_officer_only
on public.attendance_records as restrictive for update to authenticated
using (
  not exists (select 1 from public.attendance_sessions s
    where s.id = session_id and s.attendance_type = 'main' and s.status <> 'draft')
  or private.has_school_role(array['discipline_officer'])
)
with check (
  not exists (select 1 from public.attendance_sessions s
    where s.id = session_id and s.attendance_type = 'main' and s.status <> 'draft')
  or private.has_school_role(array['discipline_officer'])
);
create policy submitted_main_session_immutable
on public.attendance_sessions as restrictive for update to authenticated
using (attendance_type <> 'main' or status = 'draft')
with check (attendance_type <> 'main' or submitted_by = (select auth.uid()));
