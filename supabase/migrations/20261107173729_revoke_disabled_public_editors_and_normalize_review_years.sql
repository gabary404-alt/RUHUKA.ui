create or replace function private.apply_progression_decision(data jsonb,preview_token text,request_id uuid)returns uuid language plpgsql security definer set search_path=''as $$
declare prior private.progression_decisions;p jsonb;rid uuid:=gen_random_uuid();fingerprint text:=encode(sha256(convert_to(data::text,'UTF8')),'hex');begin
 if not private.has_school_role(array['headmaster','dean'])then raise exception 'Headmaster or Dean access required'using errcode='42501';end if;
 if request_id is null or data->'review_confirmed'is distinct from'true'::jsonb then raise exception 'Explicit human review confirmation required';end if;
 perform pg_advisory_xact_lock(hashtextextended('progression-request:'||request_id::text,0));
 select *into prior from private.progression_decisions d where d.request_id=apply_progression_decision.request_id;
 if found then if prior.created_by<>auth.uid()or prior.payload_hash<>fingerprint then raise exception 'Request differs from original manual decision';end if;return prior.id;end if;
 perform 1 from public.school_classes order by class_name for update;perform 1 from public.students where student_id=data->>'student_id'for update;
 p:=private.progression_preview(data);if p->>'preview_token'is distinct from preview_token then raise exception 'Student, results or review policy changed. Review again.'using errcode='40001';end if;
 insert into private.progression_decisions(id,student_id,source_year,decision,snapshot,reason,replaces_id,created_by,request_id,payload_hash)values(rid,data->>'student_id',p->'snapshot'->>'source_year',data->>'decision',p->'snapshot',btrim(data->>'reason'),nullif(data->>'replaces_id','')::uuid,auth.uid(),request_id,fingerprint);
 update public.students set class_name=data->>'destination_class'where student_id=data->>'student_id';
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'manual_progression_decision','student',data->>'student_id',jsonb_build_object('decision_id',rid,'before',p->'snapshot'->'student','after',p->'snapshot'->'destination','review_year',data->>'source_year','reason',data->>'reason','automatic',false));
 insert into public.school_notifications(recipient_id,actor_id,action,target)select distinct r.user_id,auth.uid(),'manual_progression_decision',data->>'student_id'from public.user_roles r join public.profiles pr on pr.id=r.user_id where r.role='headmaster'and pr.is_active and r.user_id<>auth.uid();
 return rid;
end;$$;

create or replace function private.public_editor_grant(target_user uuid,enabled boolean)returns void language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 if enabled is null or not exists(select 1 from public.profiles where id=target_user)then raise exception 'Choose an existing school account';end if;
 if enabled and not exists(select 1 from public.profiles p join public.user_roles r on r.user_id=p.id where p.id=target_user and p.is_active and r.role in('dean','discipline_officer','teacher','discipline_staff'))then raise exception 'Choose an active school staff account';end if;
 if enabled then insert into private.public_editors(user_id,granted_by)values(target_user,auth.uid())on conflict(user_id)do update set granted_by=excluded.granted_by,created_at=now();else delete from private.public_editors where user_id=target_user;end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'public_editor_access','profile',target_user::text,jsonb_build_object('enabled',enabled));
end;$$;
