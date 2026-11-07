CREATE OR REPLACE FUNCTION private.staff_directory()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not private.has_school_role(array['headmaster']) then raise exception 'Headmaster access required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name,'email',u.email,'is_active',p.is_active,'roster_import_permission',(select jsonb_build_object('expires_at',g.expires_at)from private.roster_import_grants g where g.beneficiary_id=p.id and g.consumed_at is null and g.revoked_at is null and g.expires_at>clock_timestamp()),'roles',(select coalesce(jsonb_agg(r.role order by r.role),'[]'::jsonb) from public.user_roles r where r.user_id=p.id)) order by p.display_name,p.id)
 from public.profiles p join auth.users u on u.id=p.id where (exists(select 1 from public.user_roles r where r.user_id=p.id and r.role in ('headmaster','dean','discipline_officer','discipline_staff','teacher')) or (not exists(select 1 from public.user_roles r where r.user_id=p.id) and not exists(select 1 from public.students s where s.auth_user_id=p.id)))),'[]'::jsonb);
end;$function$
;
