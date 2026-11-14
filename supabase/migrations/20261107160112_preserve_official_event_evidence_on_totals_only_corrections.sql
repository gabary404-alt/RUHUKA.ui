-- Keep earlier evidence when a correction only supplies updated totals.
create or replace function private.discipline_preview(data jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare raw_events jsonb;r jsonb;e jsonb;clean jsonb:='[]';events jsonb:='[]';roster jsonb;year text;parent uuid;old public.discipline_releases;sid text;total numeric;day date;today date:=(now()at time zone'Africa/Kigali')::date;
begin
 if not private.has_school_role(array['discipline_officer'])then raise exception 'Discipline Officer access required'using errcode='42501';end if;
 if jsonb_typeof(data)is distinct from'object' or exists(select 1 from jsonb_object_keys(data)k where k not in('class_name','release_name','recorded_on','source_reference','source_filename','events_filename','rows','events','replaces_id','correction_reason'))then raise exception 'Invalid discipline import';end if;
 if jsonb_typeof(data->'release_name')is distinct from'string'or coalesce(length(btrim(data->>'release_name')),0)not between 1 and 120 or jsonb_typeof(data->'source_reference')is distinct from'string'or coalesce(length(btrim(data->>'source_reference')),0)not between 1 and 500 or coalesce(length(data->>'source_filename'),0)not between 1 and 180 or coalesce(length(data->>'events_filename'),0)>180 or jsonb_typeof(data->'source_filename')is distinct from'string' then raise exception 'Name the upload, its file and official source reference';end if;
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
 raw_events:=case when data?'events'then data->'events'when parent is not null then old.source_events else'[]'::jsonb end;
 if jsonb_typeof(raw_events)is distinct from'array'or jsonb_array_length(raw_events)>5000 then raise exception 'Provide an events array of up to 5000 official events';end if;
 if exists(select 1 from jsonb_array_elements(raw_events)x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid event row';end if;
 if(select count(distinct x->>'event_key')from jsonb_array_elements(raw_events)x)<>jsonb_array_length(raw_events)then raise exception 'Event keys must be unique within this upload';end if;
 for e in select value from jsonb_array_elements(raw_events)order by value->>'event_key'loop
  sid:=e->>'student_id';if not exists(select 1 from jsonb_array_elements(roster)x where x->>'student_id'=sid)then raise exception 'Every event needs a matching class total';end if;
  if jsonb_typeof(e->'event_key')is distinct from'string'or coalesce(length(btrim(e->>'event_key')),0)not between 1 and 100 or jsonb_typeof(e->'reason')is distinct from'string'or coalesce(length(btrim(e->>'reason')),0)not between 1 and 1000 or coalesce(length(e->>'source_recorded_by'),0)>160 or exists(select 1 from jsonb_object_keys(e)k where k not in('student_id','event_key','event_date','reason','source_recorded_by','points_change'))then raise exception 'Each event needs a unique key, date, reason and optional original recorder/change';end if;
  if jsonb_typeof(e->'event_date')is distinct from'string'or(jsonb_typeof(e->'source_recorded_by')is not null and jsonb_typeof(e->'source_recorded_by')not in('string','null'))then raise exception 'Use a date and optional recorder text';end if;
  if(e->>'event_date')::date is null or(e->>'event_date')::date>day then raise exception 'Event date must be on or before the snapshot date';end if;
  if not(e?'points_change')or(jsonb_typeof(e->'points_change')not in('number','null'))then raise exception 'Event change must be numeric or blank';end if;
  if abs((e->>'points_change')::numeric)>40 then raise exception 'Event change must be between -40 and 40';end if;
  events:=events||jsonb_build_array(e||jsonb_build_object('source_recorded_by',nullif(btrim(e->>'source_recorded_by'),'')));
 end loop;
 return jsonb_build_object('class_name',data->>'class_name','academic_year',year,'release_name',btrim(data->>'release_name'),'recorded_on',day,'source_reference',btrim(data->>'source_reference'),'rows',clean,'events',events,'roster',roster,'replaces_id',parent,'preview_token',encode(sha256(convert_to(data::text||roster::text||year,'UTF8')),'hex'));
end;$$;

create or replace function private.discipline_apply(data jsonb,preview_token text,request_id uuid)returns uuid language plpgsql security definer set search_path=''as $$
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
 values(rid,p->>'class_name',p->>'academic_year',p->>'release_name',(p->>'recorded_on')::date,p->>'source_reference',data->>'source_filename',case when data?'events'then data->>'events_filename'else(select a.events_filename from public.discipline_releases a where a.id=parent)end,batch,parent,nullif(data->>'correction_reason',''),auth.uid(),request_id,fingerprint,source_fingerprint,p->'rows',p->'events',p->'roster');
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
