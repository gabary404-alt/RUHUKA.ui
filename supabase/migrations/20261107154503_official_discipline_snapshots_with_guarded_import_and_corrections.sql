-- Official discipline imports are snapshots, never a point-editing calculator.
create table public.discipline_releases(
 id uuid primary key default gen_random_uuid(),class_name text not null,academic_year text not null,
 release_name text not null,recorded_on date not null,source_reference text not null,
 source_filename text not null,events_filename text,
 batch_id uuid not null unique references public.import_batches(id),
 replaces_id uuid references public.discipline_releases(id),correction_reason text,
 created_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 request_id uuid not null unique,payload_hash text not null,source_hash text not null unique,
 source_rows jsonb not null,source_events jsonb not null,roster_snapshot jsonb not null
);
create unique index discipline_one_correction on public.discipline_releases(replaces_id)where replaces_id is not null;
create index discipline_release_class_date on public.discipline_releases(class_name,recorded_on desc,created_at desc);
create index discipline_release_author on public.discipline_releases(created_by);
alter table public.discipline_releases enable row level security;
revoke all on public.discipline_releases from public,anon,authenticated;
create policy discipline_release_rpc_only on public.discipline_releases for all to anon,authenticated using(false)with check(false);

create function private.discipline_preview(data jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare r jsonb;e jsonb;clean jsonb:='[]';events jsonb:='[]';roster jsonb;year text;parent uuid;old public.discipline_releases;sid text;total numeric;day date;today date:=(now()at time zone'Africa/Kigali')::date;
begin
 if not private.has_school_role(array['discipline_officer'])then raise exception 'Discipline Officer access required'using errcode='42501';end if;
 if jsonb_typeof(data)is distinct from'object' or exists(select 1 from jsonb_object_keys(data)k where k not in('class_name','release_name','recorded_on','source_reference','source_filename','events_filename','rows','events','replaces_id','correction_reason'))then raise exception 'Invalid discipline import';end if;
 if jsonb_typeof(data->'release_name')is distinct from'string'or coalesce(length(btrim(data->>'release_name')),0)not between 1 and 120 or jsonb_typeof(data->'source_reference')is distinct from'string'or coalesce(length(btrim(data->>'source_reference')),0)not between 1 and 500 or coalesce(length(data->>'source_filename'),0)not between 1 and 180 or coalesce(length(data->>'events_filename'),0)>180 then raise exception 'Name the upload, its file and official source reference';end if;
 day:=(data->>'recorded_on')::date;if day is null or day>today then raise exception 'Choose a snapshot date up to today';end if;
 select academic_year into year from public.school_classes where class_name=data->>'class_name';if not found then raise exception 'Choose an existing class';end if;
 parent:=nullif(data->>'replaces_id','')::uuid;
 if parent is not null then
  select *into old from public.discipline_releases where id=parent;
  if not found or old.class_name<>data->>'class_name'then raise exception 'Choose an import for this class';end if;
  if exists(select 1 from public.discipline_releases where replaces_id=parent)then raise exception 'This import was already corrected. Open its latest version.'using errcode='40001';end if;
  if coalesce(length(btrim(data->>'correction_reason')),0)not between 1 and 1000 then raise exception 'Explain the correction';end if;
  if day<>old.recorded_on then raise exception 'A correction keeps the original snapshot date';end if;
  roster:=old.roster_snapshot;year:=old.academic_year;
 else
  select coalesce(jsonb_agg(jsonb_build_object('student_id',s.student_id,'full_name',s.full_name,'class_name',s.class_name,'status',s.status)order by s.student_id),'[]')into roster from public.students s where s.class_name=data->>'class_name'and s.status='Active';
 end if;
 if jsonb_typeof(data->'rows')is distinct from'array'or jsonb_array_length(data->'rows')not between 1 and 1000 or jsonb_array_length(data->'rows')<>jsonb_array_length(roster)then raise exception 'Include every class student exactly once with an official total';end if;
 if exists(select 1 from jsonb_array_elements(data->'rows')x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid total row';end if;
 if(select count(distinct x->>'student_id')from jsonb_array_elements(data->'rows')x)<>jsonb_array_length(roster)then raise exception 'Duplicate student IDs';end if;
 for r in select value from jsonb_array_elements(data->'rows')order by value->>'student_id'loop
  sid:=r->>'student_id';if jsonb_typeof(r->'student_id')is distinct from'string'or jsonb_typeof(r->'official_total')is distinct from'number'or exists(select 1 from jsonb_object_keys(r)k where k not in('student_id','official_total'))then raise exception 'Each row needs student_id and a numeric official_total';end if;
  total:=(r->>'official_total')::numeric;if total<0 or total>40 then raise exception 'Official totals must be between 0 and 40';end if;
  if not exists(select 1 from jsonb_array_elements(roster)x where x->>'student_id'=sid)then raise exception 'Student % is outside this class cohort',sid;end if;
  clean:=clean||jsonb_build_array(jsonb_build_object('student_id',sid,'full_name',(select x->>'full_name'from jsonb_array_elements(roster)x where x->>'student_id'=sid),'official_total',total));
 end loop;
 if jsonb_typeof(data->'events')is distinct from'array'or jsonb_array_length(data->'events')>5000 then raise exception 'Provide an events array of up to 5000 official events';end if;
 if exists(select 1 from jsonb_array_elements(data->'events')x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid event row';end if;
 if(select count(distinct x->>'event_key')from jsonb_array_elements(data->'events')x)<>jsonb_array_length(data->'events')then raise exception 'Event keys must be unique within this upload';end if;
 for e in select value from jsonb_array_elements(data->'events')order by value->>'event_key'loop
  sid:=e->>'student_id';if not exists(select 1 from jsonb_array_elements(roster)x where x->>'student_id'=sid)then raise exception 'Every event needs a matching class total';end if;
  if jsonb_typeof(e->'event_key')is distinct from'string'or coalesce(length(btrim(e->>'event_key')),0)not between 1 and 100 or jsonb_typeof(e->'reason')is distinct from'string'or coalesce(length(btrim(e->>'reason')),0)not between 1 and 1000 or coalesce(length(e->>'source_recorded_by'),0)>160 or exists(select 1 from jsonb_object_keys(e)k where k not in('student_id','event_key','event_date','reason','source_recorded_by','points_change'))then raise exception 'Each event needs a unique key, date, reason and optional original recorder/change';end if;
  if(e->>'event_date')::date is null or(e->>'event_date')::date>day then raise exception 'Event date must be on or before the snapshot date';end if;
  if not(e?'points_change')or(jsonb_typeof(e->'points_change')not in('number','null'))then raise exception 'Event change must be numeric or blank';end if;
  if abs((e->>'points_change')::numeric)>40 then raise exception 'Event change must be between -40 and 40';end if;
  events:=events||jsonb_build_array(e||jsonb_build_object('source_recorded_by',nullif(btrim(e->>'source_recorded_by'),'')));
 end loop;
 return jsonb_build_object('class_name',data->>'class_name','academic_year',year,'release_name',btrim(data->>'release_name'),'recorded_on',day,'source_reference',btrim(data->>'source_reference'),'rows',clean,'events',events,'roster',roster,'replaces_id',parent,'preview_token',encode(sha256(convert_to(data::text||roster::text||year,'UTF8')),'hex'));
end;$$;

create function private.discipline_apply(data jsonb,preview_token text,request_id uuid)returns uuid language plpgsql security definer set search_path=''as $$
declare prior public.discipline_releases;p jsonb;rid uuid:=gen_random_uuid();batch uuid:=gen_random_uuid();r jsonb;parent uuid;fingerprint text:=encode(sha256(convert_to(data::text,'UTF8')),'hex');source_fingerprint text:=encode(sha256(convert_to((data-'source_filename'-'events_filename')::text,'UTF8')),'hex');
begin
 if not private.has_school_role(array['discipline_officer'])then raise exception 'Discipline Officer access required'using errcode='42501';end if;
 if request_id is null then raise exception 'Request ID required';end if;
 perform pg_advisory_xact_lock(hashtextextended('discipline-request:'||request_id::text,0));
 select *into prior from public.discipline_releases a where a.request_id=discipline_apply.request_id;
 if found then if prior.created_by<>auth.uid()or prior.payload_hash<>fingerprint then raise exception 'Request differs from the original import';end if;return prior.id;end if;
 perform 1 from public.school_classes order by class_name for update;
 p:=private.discipline_preview(data);
 if p->>'preview_token'is distinct from preview_token then raise exception 'Class changed after preview. Check the files again.'using errcode='40001';end if;
 select *into prior from public.discipline_releases where source_hash=source_fingerprint;if found then return prior.id;end if;
 parent:=nullif(p->>'replaces_id','')::uuid;
 if parent is null and exists(select 1 from public.discipline_releases a where a.class_name=p->>'class_name'and a.academic_year=p->>'academic_year'and a.recorded_on=(p->>'recorded_on')::date and not exists(select 1 from public.discipline_releases n where n.replaces_id=a.id))then raise exception 'A snapshot already exists for this class and date. Correct that import instead.'using errcode='40001';end if;
 insert into public.import_batches(id,import_type,status,source_filename,row_count,created_by,applied_by,applied_at,verification_reference,review_note)values(batch,'discipline','applied',data->>'source_filename',jsonb_array_length(p->'rows'),auth.uid(),auth.uid(),now(),p->>'source_reference',nullif(data->>'correction_reason',''));
 insert into public.discipline_releases(id,class_name,academic_year,release_name,recorded_on,source_reference,source_filename,events_filename,batch_id,replaces_id,correction_reason,created_by,request_id,payload_hash,source_hash,source_rows,source_events,roster_snapshot)
 values(rid,p->>'class_name',p->>'academic_year',p->>'release_name',(p->>'recorded_on')::date,p->>'source_reference',data->>'source_filename',data->>'events_filename',batch,parent,nullif(data->>'correction_reason',''),auth.uid(),request_id,fingerprint,source_fingerprint,p->'rows',p->'events',p->'roster');
 insert into public.discipline_import_snapshots(batch_id,student_id,official_total,snapshot_date)select batch,x->>'student_id',(x->>'official_total')::numeric,(p->>'recorded_on')::date from jsonb_array_elements(p->'rows')x;
 insert into public.discipline_events(student_id,event_date,reported_change,reason,recorded_by,source,source_recorded_by,import_batch_id,verification_status)
 select x->>'student_id',(x->>'event_date')::date,(x->>'points_change')::numeric,x->>'reason',auth.uid(),'discipline_import',x->>'source_recorded_by',batch,'verified'from jsonb_array_elements(p->'events')x;
 -- Older imports/corrections must never overwrite a newer current snapshot cache.
 for r in select value from jsonb_array_elements(p->'rows')loop
  update public.students st set official_discipline_points=(select d.official_total from public.discipline_import_snapshots d join public.import_batches b on b.id=d.batch_id and b.status='applied'and b.import_type='discipline'where d.student_id=st.student_id and not exists(select 1 from public.discipline_releases a join public.discipline_releases n on n.replaces_id=a.id where a.batch_id=d.batch_id)order by d.snapshot_date desc,b.applied_at desc,d.batch_id desc limit 1),
  discipline_snapshot_date=(select d.snapshot_date from public.discipline_import_snapshots d join public.import_batches b on b.id=d.batch_id and b.status='applied'and b.import_type='discipline'where d.student_id=st.student_id and not exists(select 1 from public.discipline_releases a join public.discipline_releases n on n.replaces_id=a.id where a.batch_id=d.batch_id)order by d.snapshot_date desc,b.applied_at desc,d.batch_id desc limit 1),
  discipline_snapshot_batch_id=(select d.batch_id from public.discipline_import_snapshots d join public.import_batches b on b.id=d.batch_id and b.status='applied'and b.import_type='discipline'where d.student_id=st.student_id and not exists(select 1 from public.discipline_releases a join public.discipline_releases n on n.replaces_id=a.id where a.batch_id=d.batch_id)order by d.snapshot_date desc,b.applied_at desc,d.batch_id desc limit 1)
  where st.student_id=r->>'student_id';
 end loop;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),case when parent is null then'discipline_import_published'else'discipline_import_corrected'end,'discipline_release',rid::text,jsonb_build_object('previous_release',parent,'new_release',rid,'source_reference',p->>'source_reference','correction_reason',data->>'correction_reason','payload_hash',fingerprint));
 insert into public.school_notifications(recipient_id,actor_id,action,target,priority)select distinct ur.user_id,auth.uid(),case when parent is null then'discipline_import_published'else'discipline_import_corrected'end,rid::text,'normal'from public.user_roles ur join public.profiles pr on pr.id=ur.user_id where ur.role in('headmaster','discipline_officer')and pr.is_active and ur.user_id<>auth.uid();
 return rid;
end;$$;

create function private.discipline_release_list(target_class text)returns jsonb language plpgsql security definer set search_path=''as $$
begin
 if not private.has_school_role(array['headmaster','discipline_officer'])then raise exception 'Headmaster or Discipline Officer access required'using errcode='42501';end if;
 return(select coalesce(jsonb_agg(to_jsonb(q)order by q.recorded_on desc,q.created_at desc,q.id),'[]')from(select a.id,a.class_name,a.academic_year,a.release_name,a.recorded_on,a.created_at,a.replaces_id,(select n.id from public.discipline_releases n where n.replaces_id=a.id)superseded_by from public.discipline_releases a where a.class_name=target_class order by a.recorded_on desc,a.created_at desc,a.id limit 200)q);
end;$$;
create function private.discipline_release_detail(release_id uuid,include_inactive boolean default false)returns jsonb language plpgsql security definer set search_path=''as $$
declare a public.discipline_releases;rows jsonb;events jsonb;
begin
 if not private.has_school_role(array['headmaster','discipline_officer'])then raise exception 'Headmaster or Discipline Officer access required'using errcode='42501';end if;
 select *into a from public.discipline_releases where id=release_id;if not found then raise exception 'Discipline import not found';end if;
 select coalesce(jsonb_agg(q.x||jsonb_build_object('rank',q.position)order by q.position,q.x->>'student_id'),'[]')into rows from(select x,rank()over(order by(x->>'official_total')::numeric desc)position from jsonb_array_elements(a.source_rows)x join public.students s on s.student_id=x->>'student_id'where include_inactive or(s.status='Active'and s.class_name=a.class_name))q;
 select coalesce(jsonb_agg(x order by x->>'event_date',x->>'event_key'),'[]')into events from jsonb_array_elements(a.source_events)x where exists(select 1 from jsonb_array_elements(rows)r where r->>'student_id'=x->>'student_id');
 return jsonb_build_object('id',a.id,'class_name',a.class_name,'academic_year',a.academic_year,'release_name',a.release_name,'recorded_on',a.recorded_on,'source_reference',a.source_reference,'source_filename',a.source_filename,'events_filename',a.events_filename,'rows',rows,'events',events,'created_by',a.created_by,'creator_name',(select display_name from public.profiles where id=a.created_by),'created_at',a.created_at,'replaces_id',a.replaces_id,'superseded_by',(select n.id from public.discipline_releases n where n.replaces_id=a.id),'correction_reason',a.correction_reason);
end;$$;
create function public.discipline_preview(data jsonb)returns jsonb language sql security invoker set search_path=''as $$select private.discipline_preview(data);$$;
create function public.discipline_apply(data jsonb,preview_token text,request_id uuid)returns uuid language sql security invoker set search_path=''as $$select private.discipline_apply(data,preview_token,request_id);$$;
create function public.discipline_release_list(target_class text)returns jsonb language sql security invoker set search_path=''as $$select private.discipline_release_list(target_class);$$;
create function public.discipline_release_detail(release_id uuid,include_inactive boolean default false)returns jsonb language sql security invoker set search_path=''as $$select private.discipline_release_detail(release_id,include_inactive);$$;
revoke all on function private.discipline_preview(jsonb),private.discipline_apply(jsonb,text,uuid),private.discipline_release_list(text),private.discipline_release_detail(uuid,boolean),public.discipline_preview(jsonb),public.discipline_apply(jsonb,text,uuid),public.discipline_release_list(text),public.discipline_release_detail(uuid,boolean)from public,anon;
grant execute on function private.discipline_preview(jsonb),private.discipline_apply(jsonb,text,uuid),private.discipline_release_list(text),private.discipline_release_detail(uuid,boolean),public.discipline_preview(jsonb),public.discipline_apply(jsonb,text,uuid),public.discipline_release_list(text),public.discipline_release_detail(uuid,boolean)to authenticated;
-- End the old reviewer/manual staging path; retain history and trigger safeguards.
revoke insert,update,delete on public.discipline_import_snapshots,public.discipline_import_rows,public.discipline_events from authenticated,anon;
create or replace function private.apply_discipline_import(target_batch_id uuid)returns void language plpgsql security definer set search_path=''as $$begin raise exception 'Use the checked Discipline records import workflow'using errcode='42501';end;$$;
create policy discipline_batch_insert_requires_import on public.import_batches as restrictive for insert to authenticated with check(import_type<>'discipline');
create policy discipline_batch_update_requires_import on public.import_batches as restrictive for update to authenticated using(import_type<>'discipline')with check(import_type<>'discipline');
create policy discipline_batch_delete_requires_import on public.import_batches as restrictive for delete to authenticated using(import_type<>'discipline');
alter table public.import_batches drop constraint if exists discipline_imports_require_review_evidence;
-- Current readers ignore superseded imports; legacy applied snapshots remain readable.
create function private.discipline_batch_current(target_batch uuid)returns boolean language sql stable security definer set search_path=''as $$select not exists(select 1 from public.discipline_releases a join public.discipline_releases n on n.replaces_id=a.id where a.batch_id=target_batch);$$;
revoke all on function private.discipline_batch_current(uuid)from public,anon,authenticated;
do $patch$declare src text;begin
 select pg_get_functiondef('private.my_student_records()'::regprocedure)into src;
 src:=replace(src,'where d.student_id=s.student_id and d.snapshot_date<=today','where d.student_id=s.student_id and private.discipline_batch_current(d.batch_id) and d.snapshot_date<=today');
 src:=replace(src,'where d.student_id=s.student_id and d.event_date<=today','where d.student_id=s.student_id and private.discipline_batch_current(d.import_batch_id) and d.event_date<=today');execute src;
 select pg_get_functiondef('private.refresh_school_concerns()'::regprocedure)into src;
 src:=replace(src,'where d.snapshot_date<=today order by','where d.snapshot_date<=today and private.discipline_batch_current(d.batch_id) and not exists(select 1 from public.discipline_releases a where a.batch_id=d.batch_id and (a.class_name<>s.class_name or not exists(select 1 from public.school_classes c where c.class_name=s.class_name and c.academic_year=a.academic_year))) order by');execute src;
end;$patch$;
