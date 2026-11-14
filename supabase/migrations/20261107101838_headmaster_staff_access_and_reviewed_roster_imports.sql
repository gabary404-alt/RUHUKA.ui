-- Headmaster-controlled accounts and reviewed, atomic roster CSV imports.
create or replace function private.has_school_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id
 where r.user_id=(select auth.uid()) and r.role=any(allowed_roles) and r.role<>'admin' and p.is_active)
 and (nullif(auth.jwt()->>'session_id','') is null or exists(select 1 from auth.sessions s where s.id::text=auth.jwt()->>'session_id' and s.user_id=auth.uid() and (s.not_after is null or s.not_after>now())));
$$;
-- All profile/role mutations must use audited functions, never direct REST writes.
revoke insert,update,delete on public.profiles,public.user_roles from authenticated,anon;

create or replace function private.staff_directory()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not private.has_school_role(array['headmaster']) then raise exception 'Headmaster access required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name,'email',u.email,'is_active',p.is_active,'roles',(select coalesce(jsonb_agg(r.role order by r.role),'[]'::jsonb) from public.user_roles r where r.user_id=p.id)) order by p.display_name,p.id)
 from public.profiles p join auth.users u on u.id=p.id where (exists(select 1 from public.user_roles r where r.user_id=p.id and r.role in ('headmaster','dean','discipline_officer','discipline_staff','teacher')) or (not exists(select 1 from public.user_roles r where r.user_id=p.id) and not exists(select 1 from public.students s where s.auth_user_id=p.id)))),'[]'::jsonb);
end;$$;
create or replace function private.staff_account_save(target_user uuid,display_name text,staff_roles text[],enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old_data jsonb; new_data jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('ruhuka-staff-management',0));
 if not private.has_school_role(array['headmaster']) then raise exception 'Headmaster access required' using errcode='42501';end if;
 if target_user=auth.uid() or exists(select 1 from public.user_roles r where r.user_id=target_user and r.role='headmaster') then raise exception 'Headmaster accounts cannot be changed through staff management';end if;
 if coalesce(length(btrim(display_name)),0) not between 1 and 160 or enabled is null or coalesce(cardinality(staff_roles),0) not between 1 and 4 or array_position(staff_roles,null) is not null
 or exists(select 1 from unnest(staff_roles)r where r not in ('teacher','discipline_staff','discipline_officer','dean')) or (select count(distinct r)from unnest(staff_roles)r)<>cardinality(staff_roles) then raise exception 'Choose a staff name and valid staff roles';end if;
 if not exists(select 1 from auth.users u where u.id=target_user) then raise exception 'Account not found';end if;
 if exists(select 1 from public.user_roles r where r.user_id=target_user and r.role not in ('teacher','discipline_staff','discipline_officer','dean')) or exists(select 1 from public.students s where s.auth_user_id=target_user) then raise exception 'This account is not a staff account';end if;
 perform 1 from public.profiles p where p.id=target_user for update;
 old_data:=jsonb_build_object('profile',(select to_jsonb(p)from public.profiles p where p.id=target_user),'roles',(select jsonb_agg(r.role)from public.user_roles r where r.user_id=target_user));
 insert into public.profiles(id,display_name,is_active)values(target_user,btrim(display_name),enabled) on conflict(id)do update set display_name=excluded.display_name,is_active=excluded.is_active;
 delete from public.user_roles r where r.user_id=target_user;
 insert into public.user_roles(user_id,role,granted_by)select target_user,r,auth.uid()from unnest(staff_roles)r;
 if not enabled then update auth.sessions s set not_after=now() where s.user_id=target_user;end if;
 new_data:=jsonb_build_object('display_name',btrim(display_name),'roles',staff_roles,'is_active',enabled);
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'staff_account_saved','staff_account',target_user::text,jsonb_build_object('before',old_data,'after',new_data));
 return jsonb_build_object('saved',true,'id',target_user);
end;$$;
create or replace function private.staff_email_lookup(email_address text)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 return(select u.id from auth.users u where lower(u.email)=lower(btrim(email_address))limit 1);
end;$$;

create table private.roster_import_receipts(request_id uuid primary key,actor_id uuid not null references public.profiles(id),rows_hash text not null,result jsonb not null,created_at timestamptz not null default now());
alter table private.roster_import_receipts enable row level security;
revoke all on private.roster_import_receipts from public,anon,authenticated;

create or replace function private.roster_preview(rows jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; cleaned jsonb:='[]'; before_rows jsonb; sid text; name text; cls text; state text; old public.students; additions integer:=0; changes integer:=0; unchanged integer:=0;
begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required for roster imports'using errcode='42501';end if;
 if jsonb_typeof(rows)is distinct from 'array' or jsonb_array_length(rows) not between 1 and 1000 then raise exception 'Choose 1–1000 student rows';end if;
 if exists(select 1 from jsonb_array_elements(rows) x where jsonb_typeof(x)is distinct from'object' or exists(select 1 from jsonb_object_keys(x)k where k not in ('student_id','full_name','class_name','status')))then raise exception 'Only student ID, name, class and optional status are accepted';end if;
 if exists(select 1 from jsonb_array_elements(rows)x where jsonb_typeof(x->'student_id')is distinct from'string' or jsonb_typeof(x->'full_name')is distinct from'string' or jsonb_typeof(x->'class_name')is distinct from'string' or (x?'status'and jsonb_typeof(x->'status')is distinct from'string'))then raise exception 'Roster fields must be text';end if;
 if(select count(distinct btrim(x->>'student_id'))from jsonb_array_elements(rows)x)<>jsonb_array_length(rows)then raise exception 'Duplicate student IDs in file';end if;
 for item in select value from jsonb_array_elements(rows)order by value->>'student_id' loop
 sid:=btrim(item->>'student_id');name:=btrim(item->>'full_name');cls:=btrim(item->>'class_name');state:=nullif(btrim(item->>'status'),'');
 if length(sid)not between 1 and 60 or length(name)not between 1 and 160 or length(cls)not between 1 and 80 or (state is not null and state not in ('Active','Archived','Transferred','Graduated'))then raise exception 'Invalid ID, name, class or status for student %',sid;end if;
 if not exists(select 1 from public.school_classes c where c.class_name=cls)then raise exception 'Class % does not exist; create it first',cls;end if;
 select * into old from public.students s where s.student_id=sid;
 if not found then additions:=additions+1;state:=coalesce(state,'Active');
 else state:=coalesce(state,old.status);if old.full_name is distinct from name or old.class_name is distinct from cls or old.status is distinct from state then changes:=changes+1;else unchanged:=unchanged+1;end if;end if;
 cleaned:=cleaned||jsonb_build_array(jsonb_build_object('student_id',sid,'full_name',name,'class_name',cls,'status',state));
 end loop;
 select coalesce(jsonb_agg(to_jsonb(s)order by s.student_id),'[]')into before_rows from public.students s where s.student_id in(select x->>'student_id'from jsonb_array_elements(cleaned)x);
 return jsonb_build_object('rows',cleaned,'added',additions,'updated',changes,'unchanged',unchanged,'preview_token',encode(sha256(convert_to(cleaned::text||before_rows::text,'UTF8')),'hex'));
end;$$;

create or replace function private.roster_apply(rows jsonb,preview_token text,request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p jsonb; prior private.roster_import_receipts; item jsonb; old_data jsonb; result jsonb; fingerprint text:=encode(sha256(convert_to(rows::text,'UTF8')),'hex');
begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required for roster imports'using errcode='42501';end if;
 if request_id is null then raise exception 'Import request ID required';end if;
 perform pg_advisory_xact_lock(hashtextextended('roster-import:'||request_id::text,0));
 select *into prior from private.roster_import_receipts r where r.request_id=roster_apply.request_id;
 if found then if prior.actor_id<>auth.uid() or prior.rows_hash<>fingerprint then raise exception 'Import request does not match the original request';end if;return prior.result;end if;
 -- Same class-row locks as attendance/individual roster edits; lock in stable order.
 perform 1 from public.school_classes order by class_name for update;
 p:=private.roster_preview(rows);
 if p->>'preview_token' is distinct from preview_token then raise exception 'Roster changed since preview. Review the file again.'using errcode='40001';end if;
 for item in select value from jsonb_array_elements(p->'rows')loop
 select jsonb_build_object('full_name',s.full_name,'class_name',s.class_name,'status',s.status)into old_data from public.students s where s.student_id=item->>'student_id';
 if old_data is not distinct from(item-'student_id')then continue;end if;
 insert into public.students(student_id,full_name,class_name,status)values(item->>'student_id',item->>'full_name',item->>'class_name',item->>'status')on conflict(student_id)do update set full_name=excluded.full_name,class_name=excluded.class_name,status=excluded.status;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'roster_import_row','student',item->>'student_id',jsonb_build_object('request_id',request_id,'before',old_data,'after',item-'student_id'));
 end loop;
 result:=jsonb_build_object('saved',true,'added',p->'added','updated',p->'updated','unchanged',p->'unchanged','request_id',request_id);
 insert into private.roster_import_receipts values(request_id,auth.uid(),fingerprint,result,now());
 return result;
end;$$;

create function public.staff_directory()returns jsonb language sql security invoker set search_path=''as $$select private.staff_directory();$$;
create function public.staff_account_save(target_user uuid,display_name text,staff_roles text[],enabled boolean)returns jsonb language sql security invoker set search_path=''as $$select private.staff_account_save(target_user,display_name,staff_roles,enabled);$$;
create function public.staff_email_lookup(email_address text)returns uuid language sql security invoker set search_path=''as $$select private.staff_email_lookup(email_address);$$;
create function public.roster_preview(rows jsonb)returns jsonb language sql security invoker set search_path=''as $$select private.roster_preview(rows);$$;
create function public.roster_apply(rows jsonb,preview_token text,request_id uuid)returns jsonb language sql security invoker set search_path=''as $$select private.roster_apply(rows,preview_token,request_id);$$;
revoke all on function private.staff_directory(),private.staff_account_save(uuid,text,text[],boolean),private.staff_email_lookup(text),private.roster_preview(jsonb),private.roster_apply(jsonb,text,uuid),public.staff_directory(),public.staff_account_save(uuid,text,text[],boolean),public.staff_email_lookup(text),public.roster_preview(jsonb),public.roster_apply(jsonb,text,uuid)from public,anon;
grant execute on function private.staff_directory(),private.staff_account_save(uuid,text,text[],boolean),private.staff_email_lookup(text),private.roster_preview(jsonb),private.roster_apply(jsonb,text,uuid),public.staff_directory(),public.staff_account_save(uuid,text,text[],boolean),public.staff_email_lookup(text),public.roster_preview(jsonb),public.roster_apply(jsonb,text,uuid)to authenticated;
