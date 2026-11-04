
begin;
insert into auth.users(id) select ('12000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,6)n;
insert into public.profiles(id,display_name,is_active) select ('12000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'OPS fixture '||n,true from generate_series(1,6)n on conflict(id) do update set is_active=true;
insert into public.user_roles(user_id,role) values
('12000000-0000-4000-8000-000000000001','headmaster'),('12000000-0000-4000-8000-000000000002','dean'),
('12000000-0000-4000-8000-000000000003','discipline_officer'),('12000000-0000-4000-8000-000000000004','teacher'),
('12000000-0000-4000-8000-000000000005','student'),('12000000-0000-4000-8000-000000000006','discipline_staff');
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.school_operation('class_create','{"class_name":"__OPS_S1__","grade":"S1","academic_year":"OPS"}');
select public.school_operation('class_create','{"class_name":"__OPS_S2__","grade":"S2","academic_year":"OPS"}');
select public.school_operation('term_save','{"academic_year":"OPS","term_number":1,"starts_on":"2027-01-01","ends_on":"2027-03-31"}');
select public.school_operation('term_save','{"academic_year":"OPS","term_number":2,"starts_on":"2027-04-01","ends_on":"2027-06-30"}');
select public.school_operation('term_save','{"academic_year":"OPS","term_number":3,"starts_on":"2027-07-01","ends_on":"2027-09-30"}');
do $$ declare rejected boolean:=false;begin
 begin perform public.school_operation('term_save','{"academic_year":"OPS","term_number":2,"starts_on":"2027-03-01","ends_on":"2027-06-30"}');exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL overlap accepted';end if;
 if (select count(*) from public.school_terms where academic_year='OPS')<>3 then raise exception 'FAIL three terms';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.school_operation('teacher_assign','{"teacher_user_id":"12000000-0000-4000-8000-000000000004","class_name":"__OPS_S1__","enabled":true}');
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.school_operation('student_add','{"student_id":"__OPS_STUDENT__","full_name":"OPS Student","class_name":"__OPS_S1__"}');
select set_config('test.student_request',(public.school_operation('student_change_request','{"student_id":"__OPS_STUDENT__","request":"Correct spelling to OPS Corrected"}')->>'id'),true);
do $$ begin
 begin perform public.school_operation('student_edit','{"student_id":"__OPS_STUDENT__","full_name":"Forbidden","class_name":"__OPS_S1__"}');raise exception 'FAIL officer edited roster';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.students set auth_user_id='12000000-0000-4000-8000-000000000005' where student_id='__OPS_STUDENT__';
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare notice uuid;begin
 select id into notice from public.school_notifications where target='__OPS_STUDENT__' and recipient_id=auth.uid() and priority='high' and actor_id='12000000-0000-4000-8000-000000000003';
 if notice is null then raise exception 'FAIL high priority headmaster notice';end if;
 perform public.school_operation('notification_read',jsonb_build_object('id',notice));
 if not exists(select 1 from public.school_notifications where id=notice and read_at is not null)then raise exception 'FAIL mark read';end if;
end $$;
select public.school_operation('student_edit',jsonb_build_object('student_id','__OPS_STUDENT__','full_name','OPS Corrected','class_name','__OPS_S1__','status','Active','request_id',current_setting('test.student_request')));
do $$ begin
 if not exists(select 1 from public.workflow_items where id=current_setting('test.student_request')::uuid and status='approved' and reviewed_by=auth.uid()) then raise exception 'FAIL correction request resolution';end if;
end $$;
select public.school_operation('announcement_publish','{"title":"__OPS_GLOBAL__","body":"Whole school"}');
select public.school_operation('announcement_publish','{"title":"__OPS_OTHER_CLASS__","body":"Other class","class_name":"__OPS_S2__"}');
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000004',true);
set local role authenticated;
select public.school_operation('announcement_publish','{"title":"__OPS_CLASS__","body":"Assigned class","class_name":"__OPS_S1__"}');
do $$ begin
 begin perform public.school_operation('announcement_publish','{"title":"No","body":"No school access"}');raise exception 'FAIL teacher school announcement';exception when insufficient_privilege then null;end;
 begin perform public.school_operation('announcement_publish','{"title":"No","body":"Wrong class","class_name":"__OPS_S2__"}');raise exception 'FAIL teacher wrong class announcement';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000005',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.school_announcements where title in ('__OPS_GLOBAL__','__OPS_CLASS__'))<>2 then raise exception 'FAIL student feed missing targeted posts';end if;
 if exists(select 1 from public.school_announcements where title='__OPS_OTHER_CLASS__') then raise exception 'FAIL wrong class feed';end if;
 if exists(select 1 from public.school_notifications where target='__OPS_STUDENT__')then raise exception 'FAIL other account notification visible';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
set local role authenticated;
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000004',true);
set local role authenticated;
select public.submit_main_attendance('__OPS_S1__','2026-11-04','[{"student_id":"__OPS_STUDENT__","status":"present"}]');
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.school_operation('student_edit','{"student_id":"__OPS_STUDENT__","full_name":"OPS Corrected","class_name":"__OPS_S1__","status":"Archived"}');
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$ declare rejected boolean:=false;begin
 begin perform public.submit_main_attendance('__OPS_S1__','2026-11-04','[{"student_id":"__OPS_STUDENT__","status":"present"}]');exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL archived student on active attendance';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.school_operation('teacher_assign','{"teacher_user_id":"12000000-0000-4000-8000-000000000004","class_name":"__OPS_S1__","enabled":false}');
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$ begin
 if private.can_access_class('__OPS_S1__')then raise exception 'FAIL teacher revocation';end if;
end $$;
reset role;
insert into public.student_private_contacts(student_id,guardian_name,guardian_phone,guardian_email) values('__OPS_STUDENT__','PRIVATE NAME','PRIVATE PHONE','private@example.test');
set local role authenticated;
do $$ begin
 if exists(select 1 from public.student_private_contacts where student_id='__OPS_STUDENT__')then raise exception 'FAIL teacher contact exposure';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.student_private_contacts where student_id='__OPS_STUDENT__')then raise exception 'FAIL officer contact read';end if;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from public.students where student_id='__OPS_STUDENT__' and status='Archived') then raise exception 'FAIL history not retained';end if;
end $$;

reset role;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare target_status text;begin
 foreach target_status in array array['Transferred','Graduated','Archived']loop
  perform public.school_operation('student_edit',jsonb_build_object('student_id','__OPS_STUDENT__','full_name','OPS Corrected','class_name','__OPS_S1__','status',target_status));
  if not exists(select 1 from public.attendance_records where student_id='__OPS_STUDENT__')then raise exception 'FAIL historical attendance removed';end if;
 end loop;
end $$;
reset role;
do $$declare target_role text;begin
 foreach target_role in array array['teacher','dean','student','discipline_staff','admin']loop
  update public.user_roles set role=target_role where user_id='12000000-0000-4000-8000-000000000004';
  perform set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000004',true);
  execute 'set local role authenticated';
  if exists(select 1 from public.student_private_contacts where student_id='__OPS_STUDENT__')then raise exception 'FAIL contact exposed to %',target_role;end if;
  execute 'reset role';
 end loop;
end $$;
rollback;

