-- Immutable named, class-scoped releases. All writes go through Dean-checked RPCs.
create table public.academic_releases(
 id uuid primary key default gen_random_uuid(),
 class_name text not null,
 academic_year text not null,
 release_name text not null check(length(release_name)between 1 and 120),
 recorded_on date not null,
 subjects jsonb not null,
 batch_id uuid not null unique references public.import_batches(id),
 replaces_id uuid references public.academic_releases(id),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 request_id uuid not null unique,
 payload_hash text not null,
 source_hash text not null unique,
 warnings jsonb not null,
 override_reason text,
 roster_snapshot jsonb not null
);
create unique index academic_release_one_correction on public.academic_releases(replaces_id)where replaces_id is not null;
create index academic_releases_class_date on public.academic_releases(class_name,recorded_on desc,created_at desc);
create index academic_releases_author on public.academic_releases(created_by);
create table public.academic_release_results(
 release_id uuid not null references public.academic_releases(id),
 student_id text not null references public.students(student_id),
 full_name text not null,
 marks jsonb not null,
 overall numeric,
 calculated numeric,
 published_rank integer,
 primary key(release_id,student_id),
 check(overall between 0 and 100),check(calculated between 0 and 100)
);
create index academic_release_results_student on public.academic_release_results(student_id,release_id);
alter table public.academic_releases enable row level security;
alter table public.academic_release_results enable row level security;
revoke all on public.academic_releases,public.academic_release_results from public,anon,authenticated;
-- Tables are deliberately inaccessible directly, including to ordinary school staff.
create policy academic_releases_rpc_only on public.academic_releases for all to anon,authenticated using(false)with check(false);
create policy academic_results_rpc_only on public.academic_release_results for all to anon,authenticated using(false)with check(false);

create function private.academic_preview(data jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare subj jsonb;item jsonb;mark jsonb;name text;maximum numeric;score numeric;total numeric;outof numeric;complete boolean;overall numeric;calculated numeric;warn jsonb:='[]';clean jsonb:='[]';subjects jsonb:='[]';roster jsonb;year text;old public.academic_releases;sid text;today date:=(now()at time zone'Africa/Kigali')::date;parent uuid;
begin
 if not private.has_school_role(array['dean'])then raise exception 'Dean of Studies access required to publish results'using errcode='42501';end if;
 if jsonb_typeof(data)is distinct from'object' or exists(select 1 from jsonb_object_keys(data)k where k not in('class_name','release_name','recorded_on','subjects','rows','source_filename','replaces_id'))then raise exception 'Invalid release request';end if;
 if coalesce(length(btrim(data->>'release_name')),0)not between 1 and 120 or jsonb_typeof(data->'release_name')is distinct from'string' or coalesce(length(data->>'source_filename'),0)not between 1 and 180 then raise exception 'Name the release and source file';end if;
 if (data->>'recorded_on')::date is null or(data->>'recorded_on')::date>today then raise exception 'Choose the result date, up to today';end if;
 select c.academic_year into year from public.school_classes c where c.class_name=data->>'class_name';if not found then raise exception 'Choose an existing class';end if;
 parent:=nullif(data->>'replaces_id','')::uuid;
 if parent is not null then
 select *into old from public.academic_releases where id=parent;
 if not found or old.class_name<>data->>'class_name' or old.academic_year<>year then raise exception 'Choose a release for this class and school year to correct';end if;
 if exists(select 1 from public.academic_releases where replaces_id=parent)then raise exception 'This release has already been corrected. Open its latest version.'using errcode='40001';end if;
 end if;
 if jsonb_typeof(data->'subjects')is distinct from'array' or jsonb_array_length(data->'subjects')not between 1 and 30 then raise exception 'Provide 1–30 subjects with maximum marks';end if;
 if exists(select 1 from jsonb_array_elements(data->'subjects')x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid subject definition';end if;
 if(select count(distinct btrim(x->>'name'))from jsonb_array_elements(data->'subjects')x)<>jsonb_array_length(data->'subjects')then raise exception 'Subject names must be unique';end if;
 for subj in select value from jsonb_array_elements(data->'subjects')loop
 name:=btrim(subj->>'name');if jsonb_typeof(subj->'name')is distinct from'string' or coalesce(length(name),0)not between 1 and 80 or jsonb_typeof(subj->'maximum')is distinct from'number' or exists(select 1 from jsonb_object_keys(subj)k where k not in('name','maximum'))then raise exception 'Give each subject a name and numeric maximum';end if;
 maximum:=(subj->>'maximum')::numeric;if maximum<=0 or maximum>10000 then raise exception 'Subject maximum must be greater than zero and at most 10000';end if;
 subjects:=subjects||jsonb_build_array(jsonb_build_object('name',name,'maximum',maximum));
 end loop;
 if jsonb_typeof(data->'rows')is distinct from'array' or jsonb_array_length(data->'rows')not between 1 and 1000 then raise exception 'Provide 1–1000 student rows';end if;
 if exists(select 1 from jsonb_array_elements(data->'rows')x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid student result row';end if;
 if(select count(distinct btrim(x->>'student_id'))from jsonb_array_elements(data->'rows')x)<>jsonb_array_length(data->'rows')then raise exception 'Duplicate student IDs in results';end if;
 select coalesce(jsonb_agg(jsonb_build_object('student_id',s.student_id,'full_name',s.full_name,'class_name',s.class_name,'status',s.status)order by s.student_id),'[]')into roster from public.students s where s.class_name=data->>'class_name' and s.status='Active';
 if jsonb_array_length(roster)=0 then raise exception 'This class has no active students';end if;
 if jsonb_array_length(roster)<>jsonb_array_length(data->'rows')then raise exception 'Include every active class student exactly once; leave missing marks blank';end if;
 for item in select value from jsonb_array_elements(data->'rows')order by value->>'student_id'loop
 sid:=btrim(item->>'student_id');
 if jsonb_typeof(item->'student_id')is distinct from'string' or jsonb_typeof(item->'marks')is distinct from'object' or not(item?'overall')or exists(select 1 from jsonb_object_keys(item)k where k not in('student_id','marks','overall'))then raise exception 'Provide student ID, subject marks and overall percentage';end if;
 if not exists(select 1 from jsonb_array_elements(roster)s where s->>'student_id'=sid)then raise exception 'Student % is not active in this class',sid;end if;
 if exists(select 1 from jsonb_object_keys(item->'marks')k where not exists(select 1 from jsonb_array_elements(subjects)s where s->>'name'=k)) or(select count(*)from jsonb_object_keys(item->'marks'))<>jsonb_array_length(subjects)then raise exception 'Every row must include exactly the declared subjects';end if;
 total:=0;outof:=0;complete:=true;
 for subj in select value from jsonb_array_elements(subjects)loop
 name:=subj->>'name';maximum:=(subj->>'maximum')::numeric;mark:=item->'marks'->name;outof:=outof+maximum;
 if mark='null'::jsonb then complete:=false;warn:=warn||jsonb_build_array(jsonb_build_object('student_id',sid,'kind','missing_subject','subject',name,'message',name||': Not recorded'));
 else if jsonb_typeof(mark)is distinct from'number'then raise exception 'Marks must be numbers or blank (not zero by default)';end if;score:=mark::text::numeric;if score<0 or score>maximum then raise exception 'Student %: % is outside its maximum',sid,name;end if;total:=total+score;end if;
 end loop;
 calculated:=case when complete then round(100*total/outof,4)else null end;
 if item->'overall'='null'::jsonb then overall:=null;warn:=warn||jsonb_build_array(jsonb_build_object('student_id',sid,'kind','missing_overall','message','Overall percentage: Not recorded; no rank'));
 else if jsonb_typeof(item->'overall')is distinct from'number'then raise exception 'Overall percentage must be a number or blank';end if;overall:=(item->>'overall')::numeric;if overall<0 or overall>100 then raise exception 'Overall percentage must be from 0 to 100';end if;end if;
 if calculated is not null and overall is not null and abs(calculated-overall)>0.01 then warn:=warn||jsonb_build_array(jsonb_build_object('student_id',sid,'kind','overall_mismatch','message','Supplied overall differs from weighted subject total','supplied',overall,'calculated',calculated));end if;
 clean:=clean||jsonb_build_array(jsonb_build_object('student_id',sid,'full_name',(select x->>'full_name'from jsonb_array_elements(roster)x where x->>'student_id'=sid),'marks',item->'marks','overall',overall,'calculated',calculated));
 end loop;
 -- Ranking uses supplied overall, even when one subject is blank. Missing overall gets no rank.
 with vals as(select value x from jsonb_array_elements(clean)), ranked as(select x->>'student_id' sid,rank()over(order by(x->>'overall')::numeric desc)position from vals where x->>'overall'is not null)
 select jsonb_agg(x||jsonb_build_object('rank',ranked.position)order by case when x->>'overall'is null then 1 else 0 end,(x->>'overall')::numeric desc,x->>'student_id')into clean from vals left join ranked on ranked.sid=x->>'student_id';
 return jsonb_build_object('class_name',data->>'class_name','academic_year',year,'release_name',btrim(data->>'release_name'),'recorded_on',(data->>'recorded_on')::date,'subjects',subjects,'rows',clean,'warnings',warn,'roster',roster,'replaces_id',parent,'preview_token',encode(sha256(convert_to(data::text||roster::text||coalesce(parent::text,''),'UTF8')),'hex'));
end;$$;

create function private.academic_publish(data jsonb,preview_token text,request_id uuid,override_reason text default null)returns uuid language plpgsql security definer set search_path=''as $$
declare prior public.academic_releases;p jsonb;release_id uuid:=gen_random_uuid();batch uuid:=gen_random_uuid();fingerprint text:=encode(sha256(convert_to(data::text||coalesce(override_reason,''),'UTF8')),'hex');r jsonb;parent uuid;source_fingerprint text:=encode(sha256(convert_to((data-'source_filename')::text,'UTF8')),'hex');
begin
 if not private.has_school_role(array['dean'])then raise exception 'Dean of Studies access required'using errcode='42501';end if;
 if request_id is null then raise exception 'Request ID required';end if;
 perform pg_advisory_xact_lock(hashtextextended('academic-request:'||request_id::text,0));
 select *into prior from public.academic_releases a where a.request_id=academic_publish.request_id;
 if found then if prior.created_by<>auth.uid()or prior.payload_hash<>fingerprint then raise exception 'Request differs from its original publication';end if;return prior.id;end if;
 perform 1 from public.school_classes order by class_name for update;
 p:=private.academic_preview(data);
 if p->>'preview_token'is distinct from preview_token then raise exception 'The class changed after preview. Check the file again.'using errcode='40001';end if;
 if jsonb_array_length(p->'warnings')>0 and coalesce(length(btrim(override_reason)),0)not between 1 and 1000 then raise exception 'Review the warnings or give a reason for publishing with them';end if;
 if override_reason is not null and length(override_reason)>1000 then raise exception 'Keep the warning reason under 1000 characters';end if;
 select *into prior from public.academic_releases where source_hash=source_fingerprint;if found then return prior.id;end if;
 parent:=nullif(p->>'replaces_id','')::uuid;
 if parent is null and exists(select 1 from public.academic_releases a where a.class_name=p->>'class_name'and a.academic_year=p->>'academic_year'and a.release_name=p->>'release_name'and a.recorded_on=(p->>'recorded_on')::date and not exists(select 1 from public.academic_releases n where n.replaces_id=a.id))then raise exception 'A release already has this name and date. Open it and choose Correct this release.'using errcode='40001';end if;
 if parent is not null then perform 1 from public.academic_releases where id=parent for update;if exists(select 1 from public.academic_releases where replaces_id=parent)then raise exception 'Another correction has already been published'using errcode='40001';end if;end if;
 insert into public.import_batches(id,import_type,status,source_filename,row_count,created_by,applied_by,applied_at,review_note)values(batch,'academics','applied',data->>'source_filename',jsonb_array_length(p->'rows'),auth.uid(),auth.uid(),now(),nullif(btrim(override_reason),''));
 insert into public.academic_releases(id,class_name,academic_year,release_name,recorded_on,subjects,batch_id,replaces_id,created_by,request_id,payload_hash,source_hash,warnings,override_reason,roster_snapshot)
 values(release_id,p->>'class_name',p->>'academic_year',p->>'release_name',(p->>'recorded_on')::date,p->'subjects',batch,parent,auth.uid(),request_id,fingerprint,source_fingerprint,p->'warnings',nullif(btrim(override_reason),''),p->'roster');
 insert into public.academic_release_results(release_id,student_id,full_name,marks,overall,calculated,published_rank)
 select release_id,x->>'student_id',x->>'full_name',x->'marks',(x->>'overall')::numeric,(x->>'calculated')::numeric,(x->>'rank')::integer from jsonb_array_elements(p->'rows')x;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),case when parent is null then'academic_release_published'else'academic_release_corrected'end,'academic_release',release_id::text,jsonb_build_object('previous_release',parent,'new_release',release_id,'warning_count',jsonb_array_length(p->'warnings'),'override_reason',nullif(btrim(override_reason),''),'payload_hash',fingerprint));
 insert into public.school_notifications(recipient_id,actor_id,action,target,priority)
 select ur.user_id,auth.uid(),case when parent is null then'academic_release_published'else'academic_release_corrected'end,release_id::text,'normal'from public.user_roles ur join public.profiles pr on pr.id=ur.user_id where ur.role='headmaster'and pr.is_active;
 return release_id;
end;$$;

create function private.academic_release_list(target_class text)returns jsonb language plpgsql security definer set search_path=''as $$
begin
 if not(private.has_school_role(array['headmaster','dean'])or(private.has_school_role(array['teacher'])and private.can_access_class(target_class)))then raise exception 'Academic class access required'using errcode='42501';end if;
 return(select coalesce(jsonb_agg(to_jsonb(q)order by q.recorded_on desc,q.created_at desc,q.id),'[]')from(select a.id,a.release_name,a.recorded_on,a.academic_year,a.class_name,a.created_at,a.created_by,a.replaces_id,(select r.id from public.academic_releases r where r.replaces_id=a.id)superseded_by,jsonb_array_length(a.warnings)warning_count from public.academic_releases a where a.class_name=target_class order by recorded_on desc,created_at desc,id limit 200)q);
end;$$;
create function private.academic_release_detail(release_id uuid,include_inactive boolean default false)returns jsonb language plpgsql security definer set search_path=''as $$
declare a public.academic_releases;result jsonb;
begin
 select *into a from public.academic_releases where id=release_id;if not found then raise exception 'Release not found';end if;
 if not(private.has_school_role(array['headmaster','dean'])or(private.has_school_role(array['teacher'])and private.can_access_class(a.class_name)))then raise exception 'Academic class access required'using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('student_id',r.student_id,'full_name',r.full_name,'marks',r.marks,'overall',r.overall,'calculated',r.calculated,'rank',r.published_rank,'current_status',s.status)order by r.published_rank nulls last,r.student_id),'[]')into result from public.academic_release_results r join public.students s on s.student_id=r.student_id where r.release_id=a.id and(include_inactive or(s.status='Active'and s.class_name=a.class_name));
 return jsonb_build_object('id',a.id,'class_name',a.class_name,'academic_year',a.academic_year,'release_name',a.release_name,'recorded_on',a.recorded_on,'subjects',a.subjects,'rows',result,'warnings',a.warnings,'override_reason',a.override_reason,'created_by',a.created_by,'created_at',a.created_at,'replaces_id',a.replaces_id,'superseded_by',(select id from public.academic_releases where replaces_id=a.id));
end;$$;
create function private.my_academic_releases()returns jsonb language plpgsql security definer set search_path=''as $$
declare sid text;
begin
 if not private.has_school_role(array['student'])then raise exception 'Active student account required'using errcode='42501';end if;
 select s.student_id into sid from public.students s where s.auth_user_id=auth.uid();
 return(select coalesce(jsonb_agg(to_jsonb(q)order by q.recorded_on desc,q.created_at desc,q.id),'[]')from(select a.id,a.release_name,a.recorded_on,a.class_name,a.academic_year,a.subjects,a.created_at,a.replaces_id,(select id from public.academic_releases where replaces_id=a.id)superseded_by,r.marks,r.overall,r.calculated,r.published_rank as rank from public.academic_releases a join public.academic_release_results r on r.release_id=a.id where r.student_id=sid order by a.recorded_on desc,a.created_at desc,a.id limit 100)q);
end;$$;
create function public.academic_preview(data jsonb)returns jsonb language sql security invoker set search_path=''as $$select private.academic_preview(data);$$;
create function public.academic_publish(data jsonb,preview_token text,request_id uuid,override_reason text default null)returns uuid language sql security invoker set search_path=''as $$select private.academic_publish(data,preview_token,request_id,override_reason);$$;
create function public.academic_release_list(target_class text)returns jsonb language sql security invoker set search_path=''as $$select private.academic_release_list(target_class);$$;
create function public.academic_release_detail(release_id uuid,include_inactive boolean default false)returns jsonb language sql security invoker set search_path=''as $$select private.academic_release_detail(release_id,include_inactive);$$;
create function public.my_academic_releases()returns jsonb language sql security invoker set search_path=''as $$select private.my_academic_releases();$$;
revoke all on function private.academic_preview(jsonb),private.academic_publish(jsonb,text,uuid,text),private.academic_release_list(text),private.academic_release_detail(uuid,boolean),private.my_academic_releases(),public.academic_preview(jsonb),public.academic_publish(jsonb,text,uuid,text),public.academic_release_list(text),public.academic_release_detail(uuid,boolean),public.my_academic_releases()from public,anon;
grant execute on function private.academic_preview(jsonb),private.academic_publish(jsonb,text,uuid,text),private.academic_release_list(text),private.academic_release_detail(uuid,boolean),private.my_academic_releases(),public.academic_preview(jsonb),public.academic_publish(jsonb,text,uuid,text),public.academic_release_list(text),public.academic_release_detail(uuid,boolean),public.my_academic_releases()to authenticated;
