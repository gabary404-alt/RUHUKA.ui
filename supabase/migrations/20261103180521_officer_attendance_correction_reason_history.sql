
-- Officer corrections retain row identity and require an explanation.
drop policy if exists discipline_staff_correct_main_attendance on public.attendance_records;
create policy discipline_officer_correct_main on public.attendance_records
for update to authenticated
using (private.has_school_role(array['discipline_officer']) and exists
(select 1 from public.attendance_sessions s where s.id=session_id and s.attendance_type='main' and s.status='submitted'))
with check (private.has_school_role(array['discipline_officer']) and exists
(select 1 from public.attendance_sessions s where s.id=session_id and s.attendance_type='main' and s.status='submitted'));

create or replace function private.guard_discipline_attendance_correction()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if exists(select 1 from public.attendance_sessions s where s.id=old.session_id and s.attendance_type='main' and s.status <> 'draft') then
    if not private.has_school_role(array['discipline_officer']) then
      raise exception 'Only a Discipline Officer can correct submitted attendance' using errcode='42501';
    end if;
    if new.id is distinct from old.id or new.session_id is distinct from old.session_id
       or new.student_id is distinct from old.student_id or new.created_at is distinct from old.created_at then
      raise exception 'Attendance record identity cannot be changed';
    end if;
    if nullif(btrim(new.note),'') is null then raise exception 'A correction reason is required'; end if;
    new.arrival_recorded_by := auth.uid();
  end if;
  return new;
end;
$$;

-- Keep existing append-only audit infrastructure and include original values.
create or replace function private.audit_attendance_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); target_id text;
begin
  if tg_op='DELETE' then target_id:=old.id::text; else target_id:=new.id::text; end if;
  if actor is not null then
    insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)
    values(actor,lower(tg_op),case when tg_table_name='attendance_records' then 'attendance_record' else 'attendance_session' end,target_id,
      jsonb_build_object('before',case when tg_op='INSERT' then null else to_jsonb(old) end,
                        'after',case when tg_op='DELETE' then null else to_jsonb(new) end));
  end if;
  if tg_op='DELETE' then return old; end if; return new;
end;
$$;
revoke all on function private.audit_attendance_change() from public,anon,authenticated;

-- No privileged browser key is needed; invoker executes with caller's RLS.
create or replace function public.correct_main_attendance(record_id uuid,new_status text,reason text)
returns void language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
  if auth.uid() is null or not private.has_school_role(array['discipline_officer']) then
    raise exception 'Only a Discipline Officer can correct attendance' using errcode='42501';
  end if;
  if new_status not in ('present','absent','late','excused') or new_status is null then raise exception 'Invalid attendance status'; end if;
  if nullif(btrim(reason),'') is null or length(reason)>1000 then raise exception 'Provide a correction reason of 1 to 1000 characters'; end if;
  update public.attendance_records ar set status=new_status,note=btrim(reason)
    where ar.id=record_id and exists(select 1 from public.attendance_sessions s where s.id=ar.session_id and s.attendance_type='main' and s.status='submitted');
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Submitted main attendance record not found or inaccessible'; end if;
end;
$$;
revoke all on function public.correct_main_attendance(uuid,text,text) from public,anon;
grant execute on function public.correct_main_attendance(uuid,text,text) to authenticated;
