
alter table public.user_roles drop constraint user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check(role in ('headmaster','admin','dean','discipline_officer','teacher','discipline_staff','student','parent'));

-- Staff role has school-wide attendance read access, but no correction permission.
create or replace function private.can_access_class(target_class text)
returns boolean language sql stable security definer set search_path='' as $$
 select private.has_school_role(array['headmaster','admin','dean','discipline_officer','discipline_staff'])
 or (private.has_school_role(array['teacher']) and exists(select 1 from public.teacher_class_assignments a where a.teacher_user_id=auth.uid() and a.class_name=target_class));
$$;


create or replace function private.submit_main_attendance(target_class text,day date,marks jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare session uuid; total integer; expected integer;
begin
 if auth.uid() is null or not (private.has_school_role(array['discipline_staff']) or (private.has_school_role(array['teacher']) and exists(select 1 from public.teacher_class_assignments a where a.teacher_user_id=auth.uid() and a.class_name=target_class))) then
 raise exception 'Assigned teacher or discipline staff access required' using errcode='42501'; end if;
 if day is null or target_class is null or jsonb_typeof(marks) is distinct from 'array' then raise exception 'Class, date and marks are required'; end if;
 if exists(select 1 from jsonb_array_elements(marks) x where jsonb_typeof(x) <> 'object' or x->>'student_id' is null or x->>'status' is null or x->>'status' not in ('present','absent','late','excused')) then raise exception 'Invalid attendance mark'; end if;
 perform 1 from public.school_classes where class_name=target_class for share;
 if not found then raise exception 'Class not found'; end if;
 total:=jsonb_array_length(marks);
 select count(*) into expected from public.students where class_name=target_class and status='Active';
 if total=0 or total<>expected or (select count(distinct x->>'student_id') from jsonb_array_elements(marks) x)<>total then raise exception 'Include every active student exactly once'; end if;
 if exists(select 1 from jsonb_array_elements(marks) x where not exists(select 1 from public.students s where s.student_id=x->>'student_id' and s.class_name=target_class and s.status='Active')) then raise exception 'Student does not belong to active class roster'; end if;
 insert into public.attendance_sessions(class_name,attendance_date,period,status,submitted_by,submitted_at,attendance_type)
 values(target_class,day,'Main daily attendance','submitted',auth.uid(),now(),'main') returning id into session;
 insert into public.attendance_records(session_id,student_id,status)
 select session,x->>'student_id',x->>'status' from jsonb_array_elements(marks) x;
 return session;
end;
$$;

revoke all on function private.submit_main_attendance(text,date,jsonb) from public,anon;
grant execute on function private.submit_main_attendance(text,date,jsonb) to authenticated;

create or replace function public.submit_main_attendance(target_class text,day date,marks jsonb)
returns uuid language sql security invoker set search_path='' as $$
 select private.submit_main_attendance(target_class,day,marks);
$$;
revoke all on function public.submit_main_attendance(text,date,jsonb) from public,anon;
grant execute on function public.submit_main_attendance(text,date,jsonb) to authenticated;

-- Clients must use validated transaction for main attendance. Follow-up rules stay separate.
create policy main_sessions_require_validated_submission
on public.attendance_sessions as restrictive for insert to authenticated
with check(attendance_type <> 'main');
create policy main_records_require_validated_submission
on public.attendance_records as restrictive for insert to authenticated
with check(exists(select 1 from public.attendance_sessions s where s.id=session_id and s.attendance_type <> 'main'));
revoke truncate, references, trigger on public.attendance_sessions,public.attendance_records from authenticated,anon;
