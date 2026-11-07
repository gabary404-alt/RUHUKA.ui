revoke insert,update,delete on public.academic_records from authenticated,anon;
create policy academic_batch_insert_requires_publisher on public.import_batches as restrictive for insert to authenticated with check(import_type<>'academics');
create policy academic_batch_update_requires_publisher on public.import_batches as restrictive for update to authenticated using(import_type<>'academics')with check(import_type<>'academics');
create policy academic_batch_delete_requires_publisher on public.import_batches as restrictive for delete to authenticated using(import_type<>'academics');
create or replace function private.academic_preview(data jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare subj jsonb;item jsonb;mark jsonb;name text;maximum numeric;score numeric;total numeric;outof numeric;complete boolean;overall numeric;calculated numeric;warn jsonb:='[]';clean jsonb:='[]';subjects jsonb:='[]';roster jsonb;year text;old public.academic_releases;sid text;today date:=(now()at time zone'Africa/Kigali')::date;parent uuid;
begin
 if not private.has_school_role(array['dean'])then raise exception 'Dean of Studies access required to publish results'using errcode='42501';end if;
 if jsonb_typeof(data)is distinct from'object' or exists(select 1 from jsonb_object_keys(data)k where k not in('class_name','release_name','recorded_on','subjects','rows','source_filename','replaces_id'))then raise exception 'Invalid release request';end if;
 if jsonb_typeof(data->'class_name')is distinct from'string' or jsonb_typeof(data->'recorded_on')is distinct from'string' or jsonb_typeof(data->'source_filename')is distinct from'string' or coalesce(length(btrim(data->>'release_name')),0)not between 1 and 120 or jsonb_typeof(data->'release_name')is distinct from'string' or coalesce(length(data->>'source_filename'),0)not between 1 and 180 then raise exception 'Name the release and source file';end if;
 if (data->>'recorded_on')::date is null or(data->>'recorded_on')::date>today then raise exception 'Choose the result date, up to today';end if;
 select c.academic_year into year from public.school_classes c where c.class_name=data->>'class_name';if not found then raise exception 'Choose an existing class';end if;
 parent:=nullif(data->>'replaces_id','')::uuid;
 if parent is not null then
 select *into old from public.academic_releases where id=parent;
 if not found or old.class_name<>data->>'class_name' then raise exception 'Choose a release for this class and school year to correct';end if;
 if exists(select 1 from public.academic_releases where replaces_id=parent)then raise exception 'This release has already been corrected. Open its latest version.'using errcode='40001';end if;
 year:=old.academic_year;
 end if;
 if jsonb_typeof(data->'subjects')is distinct from'array' or jsonb_array_length(data->'subjects')not between 1 and 30 then raise exception 'Provide 1–30 subjects with maximum marks';end if;
 if exists(select 1 from jsonb_array_elements(data->'subjects')x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid subject definition';end if;
 if(select count(distinct lower(btrim(x->>'name')))from jsonb_array_elements(data->'subjects')x)<>jsonb_array_length(data->'subjects')then raise exception 'Subject names must be unique';end if;
 for subj in select value from jsonb_array_elements(data->'subjects')loop
 name:=btrim(subj->>'name');if jsonb_typeof(subj->'name')is distinct from'string' or coalesce(length(name),0)not between 1 and 80 or jsonb_typeof(subj->'maximum')is distinct from'number' or exists(select 1 from jsonb_object_keys(subj)k where k not in('name','maximum'))then raise exception 'Give each subject a name and numeric maximum';end if;
 maximum:=(subj->>'maximum')::numeric;if maximum<=0 or maximum>10000 then raise exception 'Subject maximum must be greater than zero and at most 10000';end if;
 subjects:=subjects||jsonb_build_array(jsonb_build_object('name',name,'maximum',maximum));
 end loop;
 if jsonb_typeof(data->'rows')is distinct from'array' or jsonb_array_length(data->'rows')not between 1 and 1000 then raise exception 'Provide 1–1000 student rows';end if;
 if exists(select 1 from jsonb_array_elements(data->'rows')x where jsonb_typeof(x)is distinct from'object')then raise exception 'Invalid student result row';end if;
 if(select count(distinct btrim(x->>'student_id'))from jsonb_array_elements(data->'rows')x)<>jsonb_array_length(data->'rows')then raise exception 'Duplicate student IDs in results';end if;
 if parent is not null then roster:=old.roster_snapshot;else select coalesce(jsonb_agg(jsonb_build_object('student_id',s.student_id,'full_name',s.full_name,'class_name',s.class_name,'status',s.status)order by s.student_id),'[]')into roster from public.students s where s.class_name=data->>'class_name' and s.status='Active';end if;
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

