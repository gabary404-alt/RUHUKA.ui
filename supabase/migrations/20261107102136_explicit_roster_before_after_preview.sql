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
 return jsonb_build_object('rows',cleaned,'added',additions,'updated',changes,'unchanged',unchanged,'changes',(select jsonb_agg(jsonb_build_object('student_id',x->>'student_id','action',case when o is null then 'New' when (o->>'full_name'=x->>'full_name' and o->>'class_name'=x->>'class_name' and o->>'status'=x->>'status')then 'Unchanged'else 'Changed'end,'before',case when o is null then null else jsonb_build_object('full_name',o->>'full_name','class_name',o->>'class_name','status',o->>'status')end,'after',x-'student_id')order by x->>'student_id') from jsonb_array_elements(cleaned)x left join lateral(select value o from jsonb_array_elements(before_rows)where value->>'student_id'=x->>'student_id')old on true),'preview_token',encode(sha256(convert_to(cleaned::text||before_rows::text,'UTF8')),'hex'));
end;$$;

