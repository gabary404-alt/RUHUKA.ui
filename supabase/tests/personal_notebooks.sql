
begin;
insert into auth.users(id) values('11000000-0000-4000-8000-000000000001'),('11000000-0000-4000-8000-000000000002');
insert into public.profiles(id,is_active) values('11000000-0000-4000-8000-000000000001',true),('11000000-0000-4000-8000-000000000002',true) on conflict(id) do update set is_active=true;
insert into public.user_roles(user_id,role) values('11000000-0000-4000-8000-000000000001','teacher'),('11000000-0000-4000-8000-000000000002','headmaster');
select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000001',true);
set local role authenticated;
with n as(insert into public.personal_notebooks(name) values('Lesson reminders') returning id) select set_config('test.notebook',id::text,true) from n;
with n as(insert into public.personal_notes(notebook_id,title,body) values(current_setting('test.notebook')::uuid,'Plan','Keep original') returning id) select set_config('test.note',id::text,true) from n;
select public.save_personal_note(current_setting('test.note')::uuid,1,'Plan updated','Keep updated','[{"text":"Print","done":true}]');
do $$ begin
 begin
  perform public.save_personal_note(current_setting('test.note')::uuid,1,'Stale','Must not replace','[]');
  raise exception 'FAIL stale overwrite accepted';
 exception when serialization_failure then null; end;
 if not exists(select 1 from public.personal_notes where id=current_setting('test.note')::uuid and revision=2 and body='Keep updated') then raise exception 'FAIL save revision'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ declare affected integer; begin
 if exists(select 1 from public.personal_notes where id=current_setting('test.note')::uuid) then raise exception 'FAIL headmaster read another notebook'; end if;
 update public.personal_notes set body='Intrusion' where id=current_setting('test.note')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'FAIL cross-owner update'; end if;
 begin
  insert into public.personal_notes(notebook_id,title) values(current_setting('test.notebook')::uuid,'Wrong owner');
  raise exception 'FAIL cross-owner notebook link';
 exception when foreign_key_violation then null; end;
end $$;
reset role;
update public.user_roles set role='student' where user_id='11000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 begin
  insert into public.personal_notebooks(name) values('Forbidden');
  raise exception 'FAIL student notebook allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;

reset role;
select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000001',true);
set local role authenticated;
insert into public.personal_notes(notebook_id,title,body)
select current_setting('test.notebook')::uuid,'Pagination test '||n,'Unique body marker '||n from generate_series(1,205) n;
do $$ begin
 if (select count(*) from public.search_personal_notes(current_setting('test.notebook')::uuid,'',0))<>50 then raise exception 'FAIL page size'; end if;
 if (select count(*) from public.search_personal_notes(current_setting('test.notebook')::uuid,'',200))<>6 then raise exception 'FAIL notes beyond first 200'; end if;
 if not exists(select 1 from public.search_personal_notes(current_setting('test.notebook')::uuid,'Unique body marker 205',0) where total_count=1) then raise exception 'FAIL full notebook body search'; end if;
 if exists(select 1 from public.search_personal_notes(current_setting('test.notebook')::uuid,'%',0)) then raise exception 'FAIL wildcard treated as literal'; end if;
end $$;
reset role;
update public.user_roles set role='headmaster' where user_id='11000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.search_personal_notes(current_setting('test.notebook')::uuid,'',0)) then raise exception 'FAIL search privacy'; end if;
end $$;
reset role;
rollback;
