CREATE OR REPLACE FUNCTION private.school_today(day date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare tasks jsonb:='[]';v record;actor uuid:=auth.uid();head boolean:=private.has_school_role(array['headmaster']);dean boolean:=private.has_school_role(array['dean']);officer boolean:=private.has_school_role(array['discipline_officer']);n integer;
begin
 if actor is null or not private.has_school_role(array['headmaster','dean','discipline_officer','discipline_staff','teacher','student']) then raise exception 'Active school account required' using errcode='42501';end if;
 if day is null then raise exception 'Choose a date';end if;
 if not private.has_school_role(array['student']) or head or dean or officer or private.has_school_role(array['teacher','discipline_staff']) then
  for v in select c.class_name from public.school_classes c where private.can_access_class(c.class_name)
   and exists(select 1 from public.students s where s.class_name=c.class_name and s.status='Active')
   and not exists(select 1 from public.attendance_sessions a where a.class_name=c.class_name and a.attendance_date=day and a.attendance_type='main' and a.status='submitted') order by c.class_name
  loop tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','missing_attendance','class_name',v.class_name,'title',v.class_name||' · Attendance not submitted','count',1,'action','attendance'));end loop;
 end if;
 if head then
  select count(*) into n from public.workflow_items where item_type='student_change' and status='pending';
  if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','roster_requests','title','Student corrections to review','count',n,'action','roster'));end if;
 end if;
 if head or dean or officer then
  for v in select c.category,count(*) as total from public.school_concerns c where c.status='open'
   and (head or(c.category='academic' and dean)or(c.category in ('attendance','discipline')and officer)) group by c.category order by c.category
  loop tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','concerns','category',v.category,'title',initcap(v.category)||' follow-ups to review','count',v.total,'action','concerns'));end loop;
  for v in select b.import_type,count(*) as total from public.import_batches b where b.status in ('review','failed')
   and ((b.import_type='academics' and(head or dean))or(b.import_type='discipline'and(head or officer))or(b.import_type='students'and head)) group by b.import_type order by b.import_type
  loop tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','upload_issues','import_type',v.import_type,'title',initcap(v.import_type)||' uploads needing attention','count',v.total,'action','uploads'));end loop;
 end if;
 if head then
  select count(*)into n from public.school_notifications where recipient_id=actor and read_at is null and action in('academic_release_published','academic_release_corrected');
  if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','academic_publications','title','Academic results published or corrected','count',n,'action','notices'));end if;
 end if;
 select count(*) into n from public.school_notifications where recipient_id=actor and priority='high' and read_at is null;
 if n>0 then tasks:=tasks||jsonb_build_array(jsonb_build_object('kind','priority_notices','title','High priority notifications','count',n,'action','notices'));end if;
 return jsonb_build_object('day',day,'checked_at',now(),'tasks',tasks);
end;
$function$
;
