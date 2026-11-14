-- Read-only report builders; no generic SQL, contact fields or private explanations.
create function private.school_report(kind text,target_class text,start_day date,end_day date,release_id uuid default null)returns jsonb language plpgsql security definer set search_path=''as $$
declare rows jsonb;totals jsonb;selected jsonb;days integer;today date:=(now()at time zone'Africa/Kigali')::date;
begin
 if auth.uid()is null or not private.has_school_role(array['headmaster','dean','discipline_officer','teacher','discipline_staff'])then raise exception 'Active school staff access required'using errcode='42501';end if;
 if start_day is null or end_day is null or start_day>end_day or end_day>today or end_day-start_day>366 then raise exception 'Choose a date range up to today, at most 367 days';end if;
 if not exists(select 1 from public.school_classes where class_name=target_class)then raise exception 'Choose an existing class';end if;
 if kind='attendance'then
  if not(private.has_school_role(array['headmaster','dean','discipline_officer','discipline_staff'])or(private.has_school_role(array['teacher'])and private.can_access_class(target_class)))then raise exception 'Class attendance access required'using errcode='42501';end if;
  select coalesce(jsonb_agg(to_jsonb(q)order by q.student_id),'[]')into rows from(
   select r.student_id,s.full_name,count(*)filter(where r.status='present')present,count(*)filter(where r.status='late')late,count(*)filter(where r.status='absent')absent,count(*)filter(where r.status='excused')excused,count(*)recorded,
   round(100.0*count(*)filter(where r.status in('present','late'))/nullif(count(*)filter(where r.status in('present','late','absent')),0),2)attendance_percent
   from public.attendance_sessions a join public.attendance_records r on r.session_id=a.id join public.students s on s.student_id=r.student_id
   where a.class_name=target_class and a.attendance_type='main'and a.status='submitted'and a.attendance_date between start_day and end_day group by r.student_id,s.full_name)q;
  select count(*)into days from public.attendance_sessions a where a.class_name=target_class and a.attendance_type='main'and a.status='submitted'and a.attendance_date between start_day and end_day;
  select jsonb_build_object('submitted_registers',days,'students_with_marks',jsonb_array_length(rows),'unique_students_absent',count(*)filter(where(x->>'absent')::integer>0),'absence_marks',coalesce(sum((x->>'absent')::integer),0),'present_marks',coalesce(sum((x->>'present')::integer),0),'late_marks',coalesce(sum((x->>'late')::integer),0),'excused_marks',coalesce(sum((x->>'excused')::integer),0),'attendance_percent',round(100*coalesce(sum((x->>'present')::numeric+(x->>'late')::numeric),0)/nullif(sum((x->>'present')::numeric+(x->>'late')::numeric+(x->>'absent')::numeric),0),2))into totals from jsonb_array_elements(rows)x;
  return jsonb_build_object('kind',kind,'class_name',target_class,'from',start_day,'to',end_day,'generated_at',now(),'rows',rows,'totals',totals,'coverage','Recorded main registers only. Unsubmitted days are unknown, not absences. Historical class marks include students who later moved or left. Late counts as attended; Excused is excluded from the percentage. Follow-up lessons are excluded.','source_ids',(select coalesce(jsonb_agg(a.id order by a.attendance_date),'[]')from public.attendance_sessions a where a.class_name=target_class and a.attendance_type='main'and a.status='submitted'and a.attendance_date between start_day and end_day));
 elsif kind='academic'then
  selected:=private.academic_release_detail(release_id,false);
 elsif kind='discipline'then
  selected:=private.discipline_release_detail(release_id,false);
 else raise exception 'Choose attendance, academic or discipline';end if;
 if selected->>'class_name'is distinct from target_class or(selected->>'recorded_on')::date not between start_day and end_day then raise exception 'Selected release is outside the chosen class/date filters';end if;
 return jsonb_build_object('kind',kind,'class_name',target_class,'from',start_day,'to',end_day,'generated_at',now(),'release',selected,'rows',selected->'rows','coverage','One selected release only. Current view excludes students now inactive or in another class. Saved historical academic ranks are not recalculated. Academic percentages and official discipline totals stay separate.','source_ids',jsonb_build_array(release_id));
end;$$;
create function public.school_report(kind text,target_class text,start_day date,end_day date,release_id uuid default null)returns jsonb language sql security invoker set search_path=''as $$select private.school_report(kind,target_class,start_day,end_day,release_id);$$;
revoke all on function private.school_report(text,text,date,date,uuid),public.school_report(text,text,date,date,uuid)from public,anon;
grant execute on function private.school_report(text,text,date,date,uuid),public.school_report(text,text,date,date,uuid)to authenticated;
