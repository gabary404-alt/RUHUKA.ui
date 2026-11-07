create table private.roster_import_grants(
 id uuid primary key default gen_random_uuid(),beneficiary_id uuid not null references public.profiles(id),operation text not null default 'roster_import'check(operation='roster_import'),
 granted_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '24 hours',
 revoked_at timestamptz,consumed_at timestamptz,consumed_request uuid references private.roster_import_receipts(request_id),
 check((consumed_at is null)=(consumed_request is null))
);
create unique index roster_one_pending_grant on private.roster_import_grants(beneficiary_id)where consumed_at is null and revoked_at is null;
create index roster_grant_author on private.roster_import_grants(granted_by);
create index roster_grant_receipt on private.roster_import_grants(consumed_request);
alter table private.roster_import_grants enable row level security;
revoke all on private.roster_import_grants from public,anon,authenticated;
create policy roster_grants_rpc_only on private.roster_import_grants for all to anon,authenticated using(false)with check(false);
create function private.roster_import_allowed()returns boolean language sql stable security definer set search_path=''as $$
select private.has_school_role(array['headmaster'])or(private.has_school_role(array['discipline_officer'])and exists(select 1 from private.roster_import_grants g where g.beneficiary_id=auth.uid()and g.operation='roster_import'and g.consumed_at is null and g.revoked_at is null and g.expires_at>clock_timestamp()));
$$;
create function private.roster_grant_save(beneficiary uuid,allow_import boolean)returns jsonb language plpgsql security definer set search_path=''as $$
declare grant_id uuid;
begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 if allow_import is null or not exists(select 1 from public.profiles p join public.user_roles r on r.user_id=p.id where p.id=beneficiary and p.is_active and r.role='discipline_officer')then raise exception 'Choose an active Discipline Officer';end if;
 perform pg_advisory_xact_lock(hashtextextended('roster-grant:'||beneficiary::text,0));
 update private.roster_import_grants set revoked_at=clock_timestamp()where beneficiary_id=beneficiary and consumed_at is null and revoked_at is null and(not allow_import or expires_at<=clock_timestamp());
 if allow_import then
 select id into grant_id from private.roster_import_grants where beneficiary_id=beneficiary and consumed_at is null and revoked_at is null;
 if grant_id is null then insert into private.roster_import_grants(beneficiary_id,granted_by)values(beneficiary,auth.uid())returning id into grant_id;end if;
 end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),case when allow_import then'roster_import_allowed'else'roster_import_revoked'end,'staff_account',beneficiary::text,jsonb_build_object('operation','roster_import','one_successful_use',true,'grant_id',grant_id));
 return jsonb_build_object('id',grant_id,'allowed',allow_import);
end;$$;
create function private.roster_permission_state()returns jsonb language plpgsql security definer set search_path=''as $$
begin
 if not private.has_school_role(array['headmaster','discipline_officer'])then raise exception 'Roster import access required'using errcode='42501';end if;
 if private.has_school_role(array['headmaster'])then return jsonb_build_object('allowed',true,'headmaster',true);end if;
 return coalesce((select jsonb_build_object('allowed',true,'headmaster',false,'expires_at',g.expires_at)from private.roster_import_grants g where g.beneficiary_id=auth.uid()and g.consumed_at is null and g.revoked_at is null and g.expires_at>clock_timestamp()),jsonb_build_object('allowed',false,'headmaster',false));
end;$$;
create function public.roster_grant_save(beneficiary uuid,allow_import boolean)returns jsonb language sql security invoker set search_path=''as $$select private.roster_grant_save(beneficiary,allow_import);$$;
create function public.roster_permission_state()returns jsonb language sql security invoker set search_path=''as $$select private.roster_permission_state();$$;
revoke all on function private.roster_import_allowed(),private.roster_grant_save(uuid,boolean),private.roster_permission_state(),public.roster_grant_save(uuid,boolean),public.roster_permission_state()from public,anon;
grant execute on function private.roster_import_allowed(),private.roster_grant_save(uuid,boolean),private.roster_permission_state(),public.roster_grant_save(uuid,boolean),public.roster_permission_state()to authenticated;

CREATE OR REPLACE FUNCTION private.roster_preview(rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item jsonb; cleaned jsonb:='[]'; before_rows jsonb; sid text; name text; cls text; state text; old public.students; additions integer:=0; changes integer:=0; unchanged integer:=0;
begin
 if not private.roster_import_allowed()then raise exception 'Headmaster access required for roster imports'using errcode='42501';end if;
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
 return jsonb_build_object('rows',cleaned,'added',additions,'updated',changes,'unchanged',unchanged,'changes',(select jsonb_agg(jsonb_build_object('student_id',x->>'student_id','action',case when o is null then 'New' when (o->>'full_name'=x->>'full_name' and o->>'class_name'=x->>'class_name' and o->>'status'=x->>'status')then 'Unchanged'else 'Changed'end,'before',case when o is null then null else jsonb_build_object('full_name',o->>'full_name','class_name',o->>'class_name','status',o->>'status')end,'after',x-'student_id')order by x->>'student_id') from jsonb_array_elements(cleaned)x left join lateral(select value o from jsonb_array_elements(before_rows)where value->>'student_id'=x->>'student_id')old on true),'preview_token',encode(sha256(convert_to(cleaned::text||before_rows::text,'UTF8')),'hex'));
end;$function$;

CREATE OR REPLACE FUNCTION private.roster_apply(rows jsonb, preview_token text, request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p jsonb; prior private.roster_import_receipts; item jsonb; old_data jsonb; result jsonb; chosen_grant uuid; fingerprint text:=encode(sha256(convert_to(rows::text,'UTF8')),'hex');
begin
 if not private.has_school_role(array['headmaster','discipline_officer'])then raise exception 'Headmaster access required for roster imports'using errcode='42501';end if;
 if request_id is null then raise exception 'Import request ID required';end if;
 perform pg_advisory_xact_lock(hashtextextended('roster-import:'||request_id::text,0));
 select *into prior from private.roster_import_receipts r where r.request_id=roster_apply.request_id;
 if found then if prior.actor_id<>auth.uid() or prior.rows_hash<>fingerprint then raise exception 'Import request does not match the original request';end if;return prior.result;end if;
 if not private.has_school_role(array['headmaster'])then
 select g.id into chosen_grant from private.roster_import_grants g where g.beneficiary_id=auth.uid()and g.operation='roster_import'and g.consumed_at is null and g.revoked_at is null and g.expires_at>clock_timestamp() order by g.created_at for update limit 1;
 if chosen_grant is null then raise exception 'Ask the Headmaster to allow one roster import first'using errcode='42501';end if;
 end if;
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
 if chosen_grant is not null then
 update private.roster_import_grants set consumed_at=clock_timestamp(),consumed_request=roster_apply.request_id where id=chosen_grant and expires_at>clock_timestamp();
 if not found then raise exception 'Import permission expired. Ask the Headmaster for a new permission'using errcode='42501';end if;
 insert into public.school_notifications(recipient_id,actor_id,action,target,priority)select r.user_id,auth.uid(),'roster_import_applied',roster_apply.request_id::text,'high'from public.user_roles r join public.profiles p on p.id=r.user_id where r.role='headmaster'and p.is_active;
 end if;
 return result;
end;$function$;
