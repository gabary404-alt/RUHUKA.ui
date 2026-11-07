
create policy school_concern_audit_private on public.audit_events as restrictive for select to authenticated using (
 entity_type<>'school_concern' or private.has_school_role(array['headmaster'])
 or (details->>'category'='academic' and private.has_school_role(array['dean']))
 or (details->>'category' in ('attendance','discipline') and private.has_school_role(array['discipline_officer']))
);
create index audit_events_concern_history_idx on public.audit_events(entity_id,created_at desc) where entity_type='school_concern';
create function private.school_concern_history(concern_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare category text;
begin
 select c.category into category from public.school_concerns c where c.id=concern_id;
 if category is null or not (
 private.has_school_role(array['headmaster']) or
 (category='academic' and private.has_school_role(array['dean'])) or
 (category in ('attendance','discipline') and private.has_school_role(array['discipline_officer']))
 ) then raise exception 'Concern access is not permitted' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(to_jsonb(q)order by q.created_at desc,q.id),'[]') from(
 select id,actor_user_id,action,created_at,details from public.audit_events where entity_type='school_concern' and entity_id=concern_id::text order by created_at desc,id limit 100
 )q);
end;
$$;
create function public.school_concern_history(concern_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.school_concern_history(concern_id);$$;
revoke all on function private.school_concern_history(uuid),public.school_concern_history(uuid) from public,anon;
grant execute on function private.school_concern_history(uuid),public.school_concern_history(uuid) to authenticated;
