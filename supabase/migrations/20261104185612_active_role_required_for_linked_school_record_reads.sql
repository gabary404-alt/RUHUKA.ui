
create or replace function private.can_access_class(target_class text)
returns boolean language sql stable security definer set search_path='' as $$
 select private.has_school_role(array['headmaster','dean','discipline_officer','discipline_staff'])
 or (private.has_school_role(array['teacher']) and exists(select 1 from public.teacher_class_assignments a where a.teacher_user_id=auth.uid() and a.class_name=target_class));
$$;
create or replace function private.can_access_student(target_student_id text)
returns boolean language sql stable security definer set search_path='' as $$
 select private.has_school_role(array['headmaster','dean','discipline_officer','discipline_staff'])
 or (private.has_school_role(array['student']) and exists(select 1 from public.students s where s.student_id=target_student_id and s.auth_user_id=auth.uid()))
 or (private.has_school_role(array['teacher']) and exists(select 1 from public.students s join public.teacher_class_assignments a on a.class_name=s.class_name where s.student_id=target_student_id and a.teacher_user_id=auth.uid()));
$$;
revoke all on function private.can_access_class(text),private.can_access_student(text) from public,anon;
grant execute on function private.can_access_class(text),private.can_access_student(text) to authenticated;
