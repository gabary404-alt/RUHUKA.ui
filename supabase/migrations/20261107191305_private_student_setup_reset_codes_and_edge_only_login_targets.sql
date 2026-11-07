-- User passwords never enter SQL, audit records or staff screens.
create table private.student_access_codes(id uuid primary key default gen_random_uuid(),student_id text not null references public.students(student_id),purpose text not null check(purpose in('setup','reset')),code_hash text not null unique,issued_by uuid not null references public.profiles(id),expires_at timestamptz not null,created_at timestamptz not null default now(),revoked_at timestamptz,consumed_at timestamptz,completed_at timestamptz);
create index student_codes_student_date on private.student_access_codes(student_id,created_at desc);
create index student_codes_issuer on private.student_access_codes(issued_by);
create table private.access_rate_windows(bucket text not null,window_start timestamptz not null,attempts integer not null,primary key(bucket,window_start));
alter table private.student_access_codes enable row level security;alter table private.access_rate_windows enable row level security;
revoke all on private.student_access_codes,private.access_rate_windows from public,anon,authenticated;
create policy student_codes_rpc_only on private.student_access_codes for all to anon,authenticated using(false)with check(false);
create policy student_access_rate_rpc_only on private.access_rate_windows for all to anon,authenticated using(false)with check(false);
create function private.student_code_issue(target_student text,code_purpose text)returns jsonb language plpgsql security definer set search_path=''as $$
declare s public.students;secret text:=upper(replace(gen_random_uuid()::text,'-',''));cid uuid:=gen_random_uuid();expiry timestamptz;begin
 if not private.has_school_role(array['headmaster','discipline_officer'])then raise exception 'Headmaster or Discipline Officer access required'using errcode='42501';end if;
 if code_purpose not in('setup','reset')or code_purpose is null then raise exception 'Choose setup or reset';end if;
 select *into s from public.students where student_id=target_student for update;if not found or s.status<>'Active'then raise exception 'Choose an active student';end if;
 if s.auth_user_id is not null and(exists(select 1 from public.user_roles where user_id=s.auth_user_id and role<>'student')or not exists(select 1 from public.profiles where id=s.auth_user_id and is_active))then raise exception 'This account needs Headmaster review; a student code cannot change staff or disabled access';end if;
 if code_purpose='reset'and s.auth_user_id is null then raise exception 'Student account is not set up. Issue a setup code first';end if;
 if code_purpose='setup'and s.auth_user_id is not null then raise exception 'Student already has an account. Use a reset code';end if;
 if exists(select 1 from private.student_access_codes where student_id=target_student and consumed_at>clock_timestamp()-interval'5 minutes'and completed_at is null and revoked_at is null)then raise exception 'An account change is in progress. Wait five minutes before issuing another code';end if;
 expiry:=clock_timestamp()+case when code_purpose='setup'then interval'24 hours'else interval'20 minutes'end;
 update private.student_access_codes set revoked_at=clock_timestamp()where student_id=target_student and completed_at is null and revoked_at is null;
 insert into private.student_access_codes(id,student_id,purpose,code_hash,issued_by,expires_at)values(cid,target_student,code_purpose,encode(sha256(convert_to(secret,'UTF8')),'hex'),auth.uid(),expiry);
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'student_access_code_issued','student',target_student,jsonb_build_object('code_id',cid,'purpose',code_purpose,'expires_at',expiry));
 return jsonb_build_object('code_id',cid,'student_id',target_student,'full_name',s.full_name,'purpose',code_purpose,'code',secret,'expires_at',expiry);
end;$$;
create function private.student_access_state(target_student text)returns jsonb language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['headmaster','discipline_officer'])then raise exception 'Headmaster or Discipline Officer access required'using errcode='42501';end if;
 return(select jsonb_build_object('student_id',s.student_id,'full_name',s.full_name,'status',s.status,'has_account',s.auth_user_id is not null,'account_enabled',p.is_active,'recent_codes',(select coalesce(jsonb_agg(to_jsonb(q)order by q.created_at desc),'[]')from(select c.id,c.purpose,c.created_at,c.expires_at,c.revoked_at,c.consumed_at,c.completed_at,pr.display_name issuer_name from private.student_access_codes c join public.profiles pr on pr.id=c.issued_by where c.student_id=s.student_id order by c.created_at desc limit 20)q))from public.students s left join public.profiles p on p.id=s.auth_user_id where s.student_id=target_student);
end;$$;
create function private.student_access_enabled(target_student text,enabled boolean)returns void language plpgsql security definer set search_path=''as $$declare uid uuid;begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 select auth_user_id into uid from public.students where student_id=target_student for update;
 if uid is null or enabled is null or exists(select 1 from public.user_roles where user_id=uid and role<>'student')then raise exception 'Choose a linked student-only account';end if;
 if enabled and not exists(select 1 from public.students where student_id=target_student and status='Active')then raise exception 'Only an active student can be enabled';end if;
 update public.profiles set is_active=enabled where id=uid;update auth.sessions set not_after=now()where user_id=uid;
 update private.student_access_codes set revoked_at=clock_timestamp()where student_id=target_student and completed_at is null and revoked_at is null;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'student_account_access','student',target_student,jsonb_build_object('enabled',enabled));
end;$$;
-- Edge-only operations. No lookup, rate-state or redemption RPC can be called by a client role.
create function private.student_access_rate(target_student text)returns boolean language plpgsql security definer set search_path=''as $$declare n integer;total integer;w timestamptz:=date_trunc('minute',clock_timestamp());h text:='student:'||encode(sha256(convert_to(left(coalesce(target_student,''),100),'UTF8')),'hex');begin
 insert into private.access_rate_windows values('global',w,1)on conflict(bucket,window_start)do update set attempts=private.access_rate_windows.attempts+1 returning attempts into total;
 if total>100 then return false;end if;
 insert into private.access_rate_windows values(h,w,1)on conflict(bucket,window_start)do update set attempts=private.access_rate_windows.attempts+1 returning attempts into n;
 select sum(attempts)into n from private.access_rate_windows where bucket=h and window_start>=w-interval'4 minutes';
 delete from private.access_rate_windows where window_start<w-interval'1 day';return n<=10;
end;$$;
create function private.student_login_target(target_student text)returns jsonb language plpgsql security definer set search_path=''as $$begin
 return(select jsonb_build_object('user_id',s.auth_user_id,'email',u.email)from public.students s join auth.users u on u.id=s.auth_user_id join public.profiles p on p.id=u.id and p.is_active where s.student_id=target_student and s.status='Active'and exists(select 1 from public.user_roles r where r.user_id=u.id and r.role='student')and not exists(select 1 from public.user_roles r where r.user_id=u.id and r.role<>'student'));
end;$$;
create function private.student_code_consume(target_student text,secret text)returns jsonb language plpgsql security definer set search_path=''as $$declare c private.student_access_codes;s public.students;alias text;uid uuid;begin
 select *into s from public.students where student_id=target_student for update;
 if not found or s.status<>'Active'then return null;end if;
 select *into c from private.student_access_codes where student_id=target_student and code_hash=encode(sha256(convert_to(secret,'UTF8')),'hex')for update;
 if not found or c.expires_at<=clock_timestamp()or c.revoked_at is not null or c.consumed_at is not null then return null;end if;
 if s.auth_user_id is not null and(not exists(select 1 from public.profiles where id=s.auth_user_id and is_active)or exists(select 1 from public.user_roles where user_id=s.auth_user_id and role<>'student'))then return null;end if;
 alias:='s.'||encode(sha256(convert_to(s.student_id,'UTF8')),'hex')||'@students.ruhuka.invalid';uid:=s.auth_user_id;
 if uid is null then select id into uid from auth.users where email=alias;if uid is not null and(exists(select 1 from public.user_roles where user_id=uid)or exists(select 1 from public.students where auth_user_id=uid))then return null;end if;end if;
 update private.student_access_codes set consumed_at=clock_timestamp()where id=c.id;
 if uid is not null then update auth.sessions set not_after=now()where user_id=uid;end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(c.issued_by,'student_access_code_consumed','student',target_student,jsonb_build_object('code_id',c.id,'purpose',c.purpose));
 return jsonb_build_object('code_id',c.id,'student_id',s.student_id,'full_name',s.full_name,'user_id',uid,'alias',alias,'purpose',c.purpose);
end;$$;
create function private.student_code_finish(code_id uuid,target_user uuid)returns void language plpgsql security definer set search_path=''as $$declare c private.student_access_codes;s public.students;alias text;begin
 select *into c from private.student_access_codes where id=code_id for update;
 if not found or c.consumed_at is null or c.completed_at is not null or c.revoked_at is not null or c.consumed_at<clock_timestamp()-interval'5 minutes'then raise exception 'Code completion is no longer available';end if;
 select *into s from public.students where student_id=c.student_id for update;
 if s.status<>'Active'or(s.auth_user_id is not null and s.auth_user_id<>target_user)or exists(select 1 from public.user_roles where user_id=target_user and role<>'student')or exists(select 1 from public.students where auth_user_id=target_user and student_id<>s.student_id)then raise exception 'Student account link changed';end if;
 alias:='s.'||encode(sha256(convert_to(s.student_id,'UTF8')),'hex')||'@students.ruhuka.invalid';
 if not exists(select 1 from auth.users where id=target_user and(s.auth_user_id=target_user or email=alias))then raise exception 'Student account identity does not match';end if;
 if s.auth_user_id is not null and not exists(select 1 from public.profiles where id=target_user and is_active)then raise exception 'Student access was disabled';end if;
 update auth.sessions set not_after=now()where user_id=target_user;
 if s.auth_user_id is null then
  insert into public.profiles(id,display_name,is_active)values(target_user,s.full_name,true)on conflict(id)do update set display_name=excluded.display_name,is_active=true;
  insert into public.user_roles(user_id,role,granted_by)values(target_user,'student',c.issued_by)on conflict do nothing;
  update public.students set auth_user_id=target_user where student_id=s.student_id;
 end if;
 update private.student_access_codes set completed_at=clock_timestamp()where id=c.id;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(c.issued_by,'student_access_code_completed','student',s.student_id,jsonb_build_object('code_id',c.id,'purpose',c.purpose));
end;$$;
create function public.student_code_issue(target_student text,code_purpose text)returns jsonb language sql security invoker set search_path=''as $$select private.student_code_issue(target_student,code_purpose);$$;
create function public.student_access_state(target_student text)returns jsonb language sql security invoker set search_path=''as $$select private.student_access_state(target_student);$$;
create function public.student_access_enabled(target_student text,enabled boolean)returns void language sql security invoker set search_path=''as $$select private.student_access_enabled(target_student,enabled);$$;
create function public.student_access_rate(target_student text)returns boolean language sql security invoker set search_path=''as $$select private.student_access_rate(target_student);$$;
create function public.student_login_target(target_student text)returns jsonb language sql security invoker set search_path=''as $$select private.student_login_target(target_student);$$;
create function public.student_code_consume(target_student text,secret text)returns jsonb language sql security invoker set search_path=''as $$select private.student_code_consume(target_student,secret);$$;
create function public.student_code_finish(code_id uuid,target_user uuid)returns void language sql security invoker set search_path=''as $$select private.student_code_finish(code_id,target_user);$$;
revoke all on function private.student_code_issue(text,text),private.student_access_state(text),private.student_access_enabled(text,boolean),public.student_code_issue(text,text),public.student_access_state(text),public.student_access_enabled(text,boolean)from public,anon;
grant execute on function private.student_code_issue(text,text),private.student_access_state(text),private.student_access_enabled(text,boolean),public.student_code_issue(text,text),public.student_access_state(text),public.student_access_enabled(text,boolean)to authenticated;
revoke all on function private.student_access_rate(text),private.student_login_target(text),private.student_code_consume(text,text),private.student_code_finish(uuid,uuid),public.student_access_rate(text),public.student_login_target(text),public.student_code_consume(text,text),public.student_code_finish(uuid,uuid)from public,anon,authenticated;
grant execute on function private.student_access_rate(text),private.student_login_target(text),private.student_code_consume(text,text),private.student_code_finish(uuid,uuid),public.student_access_rate(text),public.student_login_target(text),public.student_code_consume(text,text),public.student_code_finish(uuid,uuid)to service_role;
