
create policy absence_explanations_private_read on public.workflow_items
as restrictive for select to authenticated
using(item_type <> 'absence_justification' or requested_by=auth.uid() or private.has_school_role(array['discipline_officer']));
create policy absence_explanations_validated_insert on public.workflow_items
as restrictive for insert to authenticated with check(item_type <> 'absence_justification');
create policy absence_explanations_validated_update on public.workflow_items
as restrictive for update to authenticated
using(item_type <> 'absence_justification') with check(item_type <> 'absence_justification');

create unique index one_pending_explanation_per_record on public.workflow_items(requested_by,(payload->>'attendance_record_id'))
where item_type='absence_justification' and status='pending';

create or replace function private.submit_absence_explanation(record_id uuid,explanation text)
returns uuid language plpgsql security definer set search_path='' as $$
declare student text; result uuid;
begin
 if auth.uid() is null or not private.has_school_role(array['student']) then raise exception 'Student access required' using errcode='42501'; end if;
 if nullif(btrim(explanation),'') is null or length(explanation)>2000 then raise exception 'Provide an explanation of 1 to 2000 characters'; end if;
 select ar.student_id into student from public.attendance_records ar
 join public.attendance_sessions s on s.id=ar.session_id join public.students st on st.student_id=ar.student_id
 where ar.id=record_id and ar.status='absent' and s.attendance_type='main' and s.status='submitted'
 and st.auth_user_id=auth.uid() and st.status='Active' for update of ar;
 if student is null then raise exception 'Your submitted main absence was not found'; end if;
 insert into public.workflow_items(item_type,student_id,requested_by,payload)
 values('absence_justification',student,auth.uid(),jsonb_build_object('attendance_record_id',record_id,'explanation',btrim(explanation))) returning id into result;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)
 values(auth.uid(),'absence_explanation_submitted','workflow_item',result::text,jsonb_build_object('attendance_record_id',record_id));
 return result;
end;
$$;
revoke all on function private.submit_absence_explanation(uuid,text) from public,anon;
grant execute on function private.submit_absence_explanation(uuid,text) to authenticated;
create or replace function public.submit_absence_explanation(record_id uuid,explanation text)
returns uuid language sql security invoker set search_path='' as $$
 select private.submit_absence_explanation(record_id,explanation);
$$;
revoke all on function public.submit_absence_explanation(uuid,text) from public,anon;
grant execute on function public.submit_absence_explanation(uuid,text) to authenticated;

create or replace function private.review_absence_explanation(item_id uuid,approve boolean,decision text)
returns void language plpgsql security definer set search_path='' as $$
declare item public.workflow_items; linked uuid; current_status text;
begin
 if auth.uid() is null or not private.has_school_role(array['discipline_officer']) then raise exception 'Discipline Officer access required' using errcode='42501'; end if;
 if approve is null or nullif(btrim(decision),'') is null or length(decision)>1000 then raise exception 'Provide a review decision of 1 to 1000 characters'; end if;
 select * into item from public.workflow_items where id=item_id and item_type='absence_justification' for update;
 if not found or item.status<>'pending' then raise exception 'Pending explanation not found; it may already be reviewed'; end if;
 linked:=(item.payload->>'attendance_record_id')::uuid;
 if linked is null then raise exception 'Explanation has no linked attendance record'; end if;
 select status into current_status from public.attendance_records where id=linked and student_id=item.student_id for update;
 if current_status is null then raise exception 'Linked attendance not found'; end if;
 if approve then
  if current_status<>'absent' then raise exception 'Attendance changed since submission. Review the record before approving.'; end if;
  perform public.correct_main_attendance(linked,'excused',btrim(decision));
 end if;
 update public.workflow_items set status=case when approve then 'approved' else 'rejected' end,
 reviewed_by=auth.uid(),reviewed_at=now(),decision_note=btrim(decision) where id=item.id;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)
 values(auth.uid(),'absence_explanation_reviewed','workflow_item',item.id::text,
 jsonb_build_object('before','pending','after',case when approve then 'approved' else 'rejected' end,'attendance_record_id',linked,'decision',btrim(decision)));
end;
$$;
revoke all on function private.review_absence_explanation(uuid,boolean,text) from public,anon;
grant execute on function private.review_absence_explanation(uuid,boolean,text) to authenticated;
create or replace function public.review_absence_explanation(item_id uuid,approve boolean,decision text)
returns void language sql security invoker set search_path='' as $$
 select private.review_absence_explanation(item_id,approve,decision);
$$;
revoke all on function public.review_absence_explanation(uuid,boolean,text) from public,anon;
grant execute on function public.review_absence_explanation(uuid,boolean,text) to authenticated;

-- Database triggers and validated operations append audits; clients cannot forge them.
revoke insert,update,delete,truncate on public.audit_events from authenticated,anon;
create policy officers_attendance_audit_read on public.audit_events for select to authenticated
using(private.has_school_role(array['discipline_officer']) and entity_type in ('attendance_record','attendance_session','workflow_item'));
