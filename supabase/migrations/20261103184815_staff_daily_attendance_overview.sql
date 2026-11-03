
create policy discipline_staff_roster_lookup on public.students for select to authenticated
using(private.has_school_role(array['discipline_staff']));
create policy discipline_staff_attendance_read on public.attendance_records for select to authenticated
using(private.has_school_role(array['discipline_staff']));

create or replace function public.main_attendance_overview(day date)
returns table(class_name text,session_id uuid,submitted_by uuid,submitted_at timestamptz,recorded bigint,absent bigint)
language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or not private.has_school_role(array['headmaster','dean','discipline_officer','discipline_staff','teacher']) then
  raise exception 'School staff access required' using errcode='42501';
 end if;
 return query
 select c.class_name,s.id,s.submitted_by,s.submitted_at,
 count(ar.id),count(ar.id) filter(where ar.status='absent')
 from public.school_classes c
 left join public.attendance_sessions s on s.class_name=c.class_name and s.attendance_date=day and s.attendance_type='main' and s.status='submitted'
 left join public.attendance_records ar on ar.session_id=s.id
 group by c.class_name,s.id,s.submitted_by,s.submitted_at order by c.class_name;
end;
$$;
revoke all on function public.main_attendance_overview(date) from public,anon;
grant execute on function public.main_attendance_overview(date) to authenticated;
