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
  perform public.correct_main_attendance(linked,'excused','Absence explanation approved: '||item.id::text);
 end if;
 update public.workflow_items set status=case when approve then 'approved' else 'rejected' end,
 reviewed_by=auth.uid(),reviewed_at=now(),decision_note=btrim(decision) where id=item.id;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)
 values(auth.uid(),'absence_explanation_reviewed','workflow_item',item.id::text,
 jsonb_build_object('before','pending','after',case when approve then 'approved' else 'rejected' end,'attendance_record_id',linked,'decision',btrim(decision)));
end;
$$;

create policy private_workflow_audit_read on public.audit_events as restrictive for select to authenticated
using(entity_type<>'workflow_item' or private.has_school_role(array['discipline_officer'])
 or exists(select 1 from public.workflow_items w where w.id::text=entity_id and w.item_type<>'absence_justification'));
