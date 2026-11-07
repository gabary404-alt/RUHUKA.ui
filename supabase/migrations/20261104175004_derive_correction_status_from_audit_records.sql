
create or replace function private.attendance_corrected_records(target_session uuid)
returns bigint language sql stable security definer set search_path='' as $$
 select count(distinct a.entity_id) from public.audit_events a
 join public.attendance_sessions s on s.id=target_session
 where a.entity_type='attendance_record' and a.action='update'
 and a.details->'after'->>'session_id'=target_session::text
 and auth.uid() is not null and private.has_school_role(array['teacher','discipline_staff','discipline_officer','headmaster','dean'])
 and private.can_access_class(s.class_name);
$$;
revoke all on function private.attendance_corrected_records(uuid) from public,anon;
grant execute on function private.attendance_corrected_records(uuid) to authenticated;
create or replace function public.main_attendance_overview_v2(day date)
returns table(class_name text,session_id uuid,submitted_by uuid,submitter_name text,submitted_at timestamptz,recorded bigint,absent bigint,corrected_records bigint)
language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or not private.has_school_role(array['teacher','discipline_staff','discipline_officer','headmaster','dean']) then raise exception 'School staff access required' using errcode='42501'; end if;
 return query select c.class_name,s.id,s.submitted_by,private.attendance_submitter_name(s.id),s.submitted_at,
 count(ar.id),count(ar.id) filter(where ar.status='absent'),private.attendance_corrected_records(s.id)
 from public.school_classes c left join public.attendance_sessions s on s.class_name=c.class_name
 and s.attendance_date=day and s.attendance_type='main' and s.status='submitted'
 left join public.attendance_records ar on ar.session_id=s.id
 group by c.class_name,s.id,s.submitted_by,s.submitted_at order by c.class_name;
end;
$$;
revoke all on function public.main_attendance_overview_v2(date) from public,anon;
grant execute on function public.main_attendance_overview_v2(date) to authenticated;
