-- Keep staff attribution intact when removing an account from the school.
alter table public.profiles
  add column staff_deleted_at timestamptz,
  add constraint deleted_staff_cannot_be_active
    check (staff_deleted_at is null or not is_active);

create or replace function private.staff_directory()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_school_role(array['headmaster']) then
    raise exception 'Headmaster access required' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'email', u.email,
      'is_active', p.is_active,
      'roles', staff.roles,
      'can_delete', cardinality(staff.roles) > 0
        and staff.roles <@ array['dean', 'discipline_officer', 'discipline_staff', 'teacher']
        and not student.linked,
      'roster_import_permission', (
        select jsonb_build_object('expires_at', g.expires_at)
        from private.roster_import_grants g
        where g.beneficiary_id = p.id and g.consumed_at is null
          and g.revoked_at is null and g.expires_at > clock_timestamp()
      )
    ) order by p.display_name, p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    cross join lateral (
      select coalesce(array_agg(r.role order by r.role), array[]::text[]) as roles
      from public.user_roles r where r.user_id = p.id
    ) staff
    cross join lateral (
      select exists(select 1 from public.students s where s.auth_user_id = p.id) as linked
    ) student
    where p.staff_deleted_at is null
      and (staff.roles && array['headmaster', 'dean', 'discipline_officer', 'discipline_staff', 'teacher']
           or (cardinality(staff.roles) = 0 and not student.linked))
  ), '[]'::jsonb);
end;
$$;

create function private.staff_account_delete(target_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  account public.profiles;
  previous_roles text[];
  deleted_at timestamptz := now();
begin
  -- Serialize with staff_account_save so a stale edit cannot restore access.
  perform pg_advisory_xact_lock(hashtextextended('ruhuka-staff-management', 0));
  if not private.has_school_role(array['headmaster']) then
    raise exception 'Headmaster access required' using errcode = '42501';
  end if;

  select p.* into account from public.profiles p where p.id = target_user for update;
  if not found then
    raise exception 'Staff account not found' using errcode = '22023';
  end if;
  if target_user = auth.uid() then
    raise exception 'Headmaster accounts cannot be deleted here' using errcode = '42501';
  end if;
  if account.staff_deleted_at is not null then
    return jsonb_build_object('deleted', true);
  end if;

  select coalesce(array_agg(r.role order by r.role), array[]::text[]) into previous_roles
  from public.user_roles r where r.user_id = target_user;
  if cardinality(previous_roles) = 0
    or not (previous_roles <@ array['dean', 'discipline_officer', 'discipline_staff', 'teacher'])
    or exists (select 1 from public.students s where s.auth_user_id = target_user) then
    raise exception 'Only staff accounts can be deleted here' using errcode = '42501';
  end if;

  update public.profiles p set is_active = false, staff_deleted_at = deleted_at where p.id = target_user;
  delete from public.user_roles r where r.user_id = target_user;
  update auth.sessions s set not_after = deleted_at where s.user_id = target_user;
  update private.roster_import_grants g set revoked_at = deleted_at
    where g.beneficiary_id = target_user and g.revoked_at is null and g.consumed_at is null;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'staff_account_deleted', 'staff_account', target_user::text,
          jsonb_build_object('previous_roles', previous_roles, 'was_active', account.is_active));

  return jsonb_build_object('deleted', true);
end;
$$;

create function public.staff_account_delete(target_user uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.staff_account_delete(target_user);
$$;

revoke all on function private.staff_account_delete(uuid), public.staff_account_delete(uuid) from public, anon;
grant execute on function private.staff_account_delete(uuid), public.staff_account_delete(uuid) to authenticated;
