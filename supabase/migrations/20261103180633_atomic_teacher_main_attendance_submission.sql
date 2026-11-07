
create or replace function public.submit_main_attendance(target_class text,day date,marks jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare session uuid; total integer; expected integer;
begin
 if auth.uid() is null or not private.has_school_role(array['teacher']) or not private.can_access_class(target_class) then
 raise exception 'Assigned teacher access required' using errcode='42501'; end if;
 if day is null or target_class is null or jsonb_typeof(marks) is distinct from 'array' then raise exception 'Class, date and marks are required'; end if;
 if exists(select 1 from jsonb_array_elements(marks) x where jsonb_typeof(x) <> 'object' or x->>'student_id' is null or x->>'status' is null or x->>'status' not in ('present','absent','late','excused')) then raise exception 'Invalid attendance mark'; end if;
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
revoke all on function public.submit_main_attendance(text,date,jsonb) from public,anon;
grant execute on function public.submit_main_attendance(text,date,jsonb) to authenticated;
