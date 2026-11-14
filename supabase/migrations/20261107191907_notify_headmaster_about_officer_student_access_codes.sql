create or replace function private.student_code_issue(target_student text,code_purpose text)returns jsonb language plpgsql security definer set search_path=''as $$
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
 if private.has_school_role(array['discipline_officer'])and not private.has_school_role(array['headmaster'])then insert into public.school_notifications(recipient_id,actor_id,action,target,priority)select distinct ur.user_id,auth.uid(),'student_access_code_issued',target_student,'high'from public.user_roles ur join public.profiles pr on pr.id=ur.user_id where ur.role='headmaster'and pr.is_active;end if;
 return jsonb_build_object('code_id',cid,'student_id',target_student,'full_name',s.full_name,'purpose',code_purpose,'code',secret,'expires_at',expiry);
end;$$;
