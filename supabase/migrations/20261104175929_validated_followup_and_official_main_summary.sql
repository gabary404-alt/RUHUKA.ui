create or replace function private.submit_followup_attendance(target_class text,day date,lesson text,marks jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare session uuid; total integer; expected integer;
begin
 if auth.uid() is null or not (private.has_school_role(array['discipline_staff']) or (private.has_school_role(array['teacher']) and exists(select 1 from public.teacher_class_assignments a where a.teacher_user_id=auth.uid() and a.class_name=target_class))) then
 raise exception 'Assigned teacher or discipline staff access required' using errcode='42501'; end if;
 if nullif(btrim(lesson),'') is null or length(lesson)>80 then raise exception 'Name the follow-up lesson (1 to 80 characters)'; end if;
 if day is null or target_class is null or jsonb_typeof(marks) is distinct from 'array' then raise exception 'Class, date and marks are required'; end if;
 if exists(select 1 from jsonb_array_elements(marks) x where jsonb_typeof(x) <> 'object' or x->>'student_id' is null or x->>'status' is null or x->>'status' not in ('present','absent','late','excused')) then raise exception 'Invalid attendance mark'; end if;
 perform 1 from public.school_classes where class_name=target_class for share;
 if not found then raise exception 'Class not found'; end if;
 total:=jsonb_array_length(marks);
 select count(*) into expected from public.students where class_name=target_class and status='Active';
 if total=0 or total<>expected or (select count(distinct x->>'student_id') from jsonb_array_elements(marks) x)<>total then raise exception 'Include every active student exactly once'; end if;
 if exists(select 1 from jsonb_array_elements(marks) x where not exists(select 1 from public.students s where s.student_id=x->>'student_id' and s.class_name=target_class and s.status='Active')) then raise exception 'Student does not belong to active class roster'; end if;
 insert into public.attendance_sessions(class_name,attendance_date,period,status,submitted_by,submitted_at,attendance_type)
 values(target_class,day,btrim(lesson),'submitted',auth.uid(),now(),'period_followup') returning id into session;
 insert into public.attendance_records(session_id,student_id,status)
 select session,x->>'student_id',x->>'status' from jsonb_array_elements(marks) x;
 return session;
end;
$$;


revoke all on function private.submit_followup_attendance(text,date,text,jsonb) from public,anon;
grant execute on function private.submit_followup_attendance(text,date,text,jsonb) to authenticated;
create or replace function public.submit_followup_attendance(target_class text,day date,lesson text,marks jsonb)
returns uuid language sql security invoker set search_path='' as $$
 select private.submit_followup_attendance(target_class,day,lesson,marks);
$$;
revoke all on function public.submit_followup_attendance(text,date,text,jsonb) from public,anon;
grant execute on function public.submit_followup_attendance(text,date,text,jsonb) to authenticated;
revoke insert on public.attendance_sessions,public.attendance_records from anon,authenticated;

create or replace function public.class_main_attendance_summary(target_class text,start_day date,end_day date)
returns table(present_marks bigint,absent_marks bigint,late_marks bigint,excused_marks bigint,main_sessions bigint,attendance_rate numeric)
language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or not private.has_school_role(array['teacher','discipline_staff','discipline_officer','dean','headmaster']) or not private.can_access_class(target_class) then raise exception 'Class staff access required' using errcode='42501'; end if;
 if start_day is null or end_day is null or start_day>end_day then raise exception 'Choose a valid date range'; end if;
 return query select count(ar.id) filter(where ar.status='present'),count(ar.id) filter(where ar.status='absent'),
 count(ar.id) filter(where ar.status='late'),count(ar.id) filter(where ar.status='excused'),count(distinct s.id),
 round(100.0*count(ar.id) filter(where ar.status in ('present','late'))/nullif(count(ar.id) filter(where ar.status<>'excused'),0),1)
 from public.attendance_sessions s left join public.attendance_records ar on ar.session_id=s.id
 where s.class_name=target_class and s.attendance_type='main' and s.status='submitted' and s.attendance_date between start_day and end_day;
end;
$$;
revoke all on function public.class_main_attendance_summary(text,date,date) from public,anon;
grant execute on function public.class_main_attendance_summary(text,date,date) to authenticated;
