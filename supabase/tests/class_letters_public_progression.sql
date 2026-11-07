begin;
insert into auth.users(id)select('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,8)n;
insert into public.profiles(id,display_name,is_active)select('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'LETTER fixture '||n,true from generate_series(1,8)n on conflict(id)do update set is_active=true;
insert into public.user_roles(user_id,role)values('20000000-0000-4000-8000-000000000001','headmaster'),('20000000-0000-4000-8000-000000000002','dean'),('20000000-0000-4000-8000-000000000003','discipline_officer'),('20000000-0000-4000-8000-000000000004','teacher'),('20000000-0000-4000-8000-000000000005','discipline_staff'),('20000000-0000-4000-8000-000000000006','student'),('20000000-0000-4000-8000-000000000007','teacher'),('20000000-0000-4000-8000-000000000008','admin');
insert into public.school_classes(class_name,grade,academic_year)values('__LETTER_S1__','S1','2026'),('__LETTER_S2_NEXT__','S2','2027'),('__LETTER_S1_NEXT__','S1','2027');
insert into public.students(student_id,full_name,class_name)select '__LETTER_'||x||'__','Synthetic '||x,'__LETTER_S1__'from unnest(array['A','B','C'])x;
update public.students set auth_user_id='20000000-0000-4000-8000-000000000006'where student_id='__LETTER_C__';
insert into public.student_private_contacts(student_id,guardian_name,guardian_phone,guardian_email)values('__LETTER_A__','SECRET_GUARDIAN','SECRET_PHONE','secret@example.test');
insert into public.teacher_class_assignments(teacher_user_id,class_name)values('20000000-0000-4000-8000-000000000004','__LETTER_S1__');
create temporary table letter_test(ac uuid,disc uuid,letter uuid,filters jsonb,decision uuid,record_id uuid);
insert into letter_test(filters)values(jsonb_build_object('class_name','__LETTER_S1__','academic_year','2026','start_day',current_date-4,'end_day',current_date));grant all on letter_test to authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000004',true);
set local role authenticated;
select public.submit_main_attendance('__LETTER_S1__',current_date-2,'[{"student_id":"__LETTER_A__","status":"present"},{"student_id":"__LETTER_B__","status":"absent"},{"student_id":"__LETTER_C__","status":"excused"}]');
select public.submit_main_attendance('__LETTER_S1__',current_date-1,'[{"student_id":"__LETTER_A__","status":"late"},{"student_id":"__LETTER_B__","status":"absent"},{"student_id":"__LETTER_C__","status":"present"}]');
select public.submit_followup_attendance('__LETTER_S1__',current_date,'Synthetic followup','[{"student_id":"__LETTER_A__","status":"absent"},{"student_id":"__LETTER_B__","status":"absent"},{"student_id":"__LETTER_C__","status":"absent"}]');
reset role;
update letter_test set record_id=(select r.id from public.attendance_records r join public.attendance_sessions a on a.id=r.session_id where a.class_name='__LETTER_S1__'and a.attendance_type='main'and a.attendance_date=current_date-2 and r.student_id='__LETTER_B__');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.correct_main_attendance((select record_id from letter_test),'late','SECRET_MEDICAL_REASON');
do $$declare d jsonb;p jsonb;rid uuid;begin
 d:=jsonb_build_object('class_name','__LETTER_S1__','release_name','Official source','recorded_on',current_date,'source_reference','Synthetic official book','source_filename','synthetic.csv','rows','[{"student_id":"__LETTER_A__","official_total":40},{"student_id":"__LETTER_B__","official_total":0},{"student_id":"__LETTER_C__","official_total":20}]'::jsonb,'events',jsonb_build_array(jsonb_build_object('student_id','__LETTER_B__','event_key','fixture-event','event_date',current_date-1,'reason','Official source reason','source_recorded_by','Original recorder','points_change',null)));p:=public.discipline_preview(d);rid:=public.discipline_apply(d,p->>'preview_token','50000000-0000-4000-8000-000000000001');update letter_test set disc=rid;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare d jsonb;p jsonb;rid uuid;begin
 d:=jsonb_build_object('class_name','__LETTER_S1__','release_name','Term tests','recorded_on',current_date,'source_filename','synthetic.csv','subjects','[{"name":"Math","maximum":40},{"name":"English","maximum":60}]'::jsonb,'rows','[{"student_id":"__LETTER_A__","marks":{"Math":40,"English":60},"overall":100},{"student_id":"__LETTER_B__","marks":{"Math":null,"English":0},"overall":0},{"student_id":"__LETTER_C__","marks":{"Math":0,"English":0},"overall":null}]'::jsonb);p:=public.academic_preview(d);rid:=public.academic_publish(d,p->>'preview_token','50000000-0000-4000-8000-000000000002','Missing tests under review');update letter_test set ac=rid;
end $$;
do $$declare f jsonb:=(select filters from letter_test);p jsonb;d jsonb;rid uuid;begin
 p:=public.class_letter_preview(f);if p->'snapshot'->'academic'<>'null'::jsonb or p->'snapshot'->'discipline'<>'null'::jsonb then raise exception 'FAIL invented missing releases';end if;
 f:=f||jsonb_build_object('academic_release_id',(select ac from letter_test),'discipline_release_id',(select disc from letter_test));update letter_test set filters=f;p:=public.class_letter_preview(f);
 if(p->'snapshot'->'attendance'->'totals'->>'submitted_registers')::int<>2 or(p->'snapshot'->'attendance'->'totals'->>'unique_students_absent')::int<>1 or(p->'snapshot'->'attendance'->'totals'->>'absence_marks')::int<>1 or(p->'snapshot'->'attendance'->>'returned_records')::int<>1 then raise exception 'FAIL attendance letter double count/returns';end if;
 if(p->'snapshot'->'academic'->>'mean_percentage')::numeric<>50 or(p->'snapshot'->'academic'->>'missing_totals')::int<>1 or(p->'snapshot'->'academic'->>'zero_totals')::int<>1 or(p->'snapshot'->'academic'->>'missing_subject_marks')::int<>1 then raise exception 'FAIL missing/zero academic source';end if;
 if p::text like'%SECRET_%'or p::text like'%guardian%'or p::text like'%secret@example%'then raise exception 'FAIL private data in letter';end if;
 if(p->'snapshot'->'discipline'->'rows'->1->>'official_total')::numeric<>0 or p->'snapshot'->'discipline'->'events'->0->>'source_recorded_by'<>'Original recorder'then raise exception 'FAIL official source/recorder';end if;
 d:=jsonb_build_object('filters',f,'title','Weekly class letter','comments','Follow-up reviewed by the school.','review_confirmed',true);
 begin perform public.save_class_letter(d,'tampered','50000000-0000-4000-8000-000000000009');raise exception 'FAIL altered preview';exception when serialization_failure then null;end;
 begin perform public.save_class_letter(d||'{"snapshot":{"fake":100}}',p->>'preview_token','50000000-0000-4000-8000-000000000009');raise exception 'FAIL injected metrics';exception when raise_exception then if sqlerrm='FAIL injected metrics'then raise;end if;end;
 rid:=public.save_class_letter(d,p->>'preview_token','50000000-0000-4000-8000-000000000003');update letter_test set letter=rid;
 if public.save_class_letter(d,p->>'preview_token','50000000-0000-4000-8000-000000000003')<>rid then raise exception 'FAIL letter retry';end if;
 if(public.class_letter_detail(rid)->>'sources_changed')::boolean then raise exception 'FAIL unchanged sources falsely stale';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.correct_main_attendance((select r.id from public.attendance_records r join public.attendance_sessions a on a.id=r.session_id where a.class_name='__LETTER_S1__'and a.attendance_type='main'and a.attendance_date=current_date-1 and r.student_id='__LETTER_B__'),'present','SECRET_RETURN_REASON');
do $$declare l jsonb;d jsonb;p jsonb;n uuid;begin
 l:=public.class_letter_detail((select letter from letter_test));if not(l->>'sources_changed')::boolean or(l->'snapshot'->'attendance'->'totals'->>'absence_marks')::int<>1 then raise exception 'FAIL earlier snapshot rewritten';end if;
 d:=jsonb_build_object('filters',(select filters from letter_test),'title','Weekly class letter','comments','Reviewed after return.','parent_id',(select letter from letter_test),'review_confirmed',true);p:=public.class_letter_preview(d->'filters');n:=public.save_class_letter(d,p->>'preview_token','50000000-0000-4000-8000-000000000004');
 if(public.class_letter_detail(n)->'snapshot'->'attendance'->'totals'->>'absence_marks')::int<>0 then raise exception 'FAIL new letter does not use correction';end if;
 begin perform public.save_class_letter(d,p->>'preview_token','50000000-0000-4000-8000-000000000005');raise exception 'FAIL duplicate version parent';exception when serialization_failure then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$begin
 if jsonb_array_length(public.class_letter_list('__LETTER_S1__'))<>2 then raise exception 'FAIL Headmaster letter access';end if;
 if not exists(select 1 from jsonb_array_elements(public.school_today(current_date)->'tasks')x where x->>'kind'='class_letters'and(x->>'count')::int=2)then raise exception 'FAIL Today saved letters';end if;
 begin perform public.save_class_letter(jsonb_build_object('filters',(select filters from letter_test),'title','Not an author','comments','','review_confirmed',true),'invalid','50000000-0000-4000-8000-000000000006');raise exception 'FAIL Headmaster author';exception when insufficient_privilege then null;end;
end $$;
-- Public publication: school-approved fields only, named editors and stale-version guards.
do $$declare d jsonb:='{"introduction":"Synthetic public introduction","academics":"Synthetic subjects","activities":"Synthetic activities","news":"Synthetic public notice","contact":"Synthetic school contact"}';r integer;begin
 r:=public.publish_public_content(d,0,true);if r<>1 then raise exception 'FAIL public revision';end if;
 begin perform public.publish_public_content(d||'{"guardian":"SECRET"}',1,true);raise exception 'FAIL unknown public field';exception when raise_exception then if sqlerrm='FAIL unknown public field'then raise;end if;end;
 begin perform public.publish_public_content(d,1,false);raise exception 'FAIL no school approval';exception when raise_exception then if sqlerrm='FAIL no school approval'then raise;end if;end;
 begin perform public.publish_public_content(d||'{"news":"Changed"}',0,true);raise exception 'FAIL stale public editor';exception when serialization_failure then null;end;
 perform public.public_editor_grant('20000000-0000-4000-8000-000000000004',true);
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$declare d jsonb;begin
 d:=public.public_content_editor_state()->'content';perform public.publish_public_content(d||'{"news":"Updated synthetic notice"}',1,true);
 begin perform public.public_editor_grant('20000000-0000-4000-8000-000000000007',true);raise exception 'FAIL editor granting editors';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
set local role authenticated;
reset role;update public.profiles set is_active=false where id='20000000-0000-4000-8000-000000000004';set local role authenticated;
select public.public_editor_grant('20000000-0000-4000-8000-000000000004',false);
reset role;update public.profiles set is_active=true where id='20000000-0000-4000-8000-000000000004';set local role authenticated;
reset role;
-- Human progression review does not mutate anything until explicit confirmation.
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.set_progression_threshold('2026',55);
do $$declare d jsonb;p jsonb;rid uuid;begin
 d:=jsonb_build_object('student_id','__LETTER_B__','source_year','2026','decision','promote','destination_class','__LETTER_S2_NEXT__','academic_release_id',(select ac from letter_test),'reason','Human review concluded promotion with follow-up.','review_confirmed',true);p:=public.progression_preview(d);
 if(p->'snapshot'->>'review_threshold')::numeric<>55 or not(p->'snapshot'->>'needs_mark_review')::boolean then raise exception 'FAIL configurable human review warning';end if;
 begin perform public.apply_progression_decision(d||'{"review_confirmed":false}',p->>'preview_token','50000000-0000-4000-8000-000000000006');raise exception 'FAIL no explicit decision confirmation';exception when raise_exception then if sqlerrm='FAIL no explicit decision confirmation'then raise;end if;end;
 perform public.set_progression_threshold('2026',60);
 begin perform public.apply_progression_decision(d,p->>'preview_token','50000000-0000-4000-8000-000000000006');raise exception 'FAIL stale decision policy';exception when serialization_failure then null;end;
 p:=public.progression_preview(d);rid:=public.apply_progression_decision(d,p->>'preview_token','50000000-0000-4000-8000-000000000006');update letter_test set decision=rid;
 if public.apply_progression_decision(d,p->>'preview_token','50000000-0000-4000-8000-000000000006')<>rid then raise exception 'FAIL decision retry';end if;
 begin perform public.progression_preview(d);raise exception 'FAIL unlinked repeated decision';exception when serialization_failure then null;end;
 d:=d||jsonb_build_object('decision','repeat','destination_class','__LETTER_S1_NEXT__','replaces_id',rid,'reason','Further human review concluded repeat.');p:=public.progression_preview(d);perform public.apply_progression_decision(d,p->>'preview_token','50000000-0000-4000-8000-000000000007');
 if jsonb_array_length(public.progression_context('__LETTER_B__')->'decisions')<>2 then raise exception 'FAIL decision history lost';end if;
end $$;
reset role;
do $$begin if(select class_name from public.students where student_id='__LETTER_B__')<>'__LETTER_S1_NEXT__'then raise exception 'FAIL manual correction destination';end if;if(select count(*)from private.student_enrolment_history where student_id='__LETTER_B__')<>3 then raise exception 'FAIL previous class history';end if;end $$;
-- Review-year whitespace cannot create a second decision root.
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare d jsonb;p jsonb;begin
 d:=jsonb_build_object('student_id','__LETTER_A__','source_year',' 2026 ','decision','promote','destination_class','__LETTER_S2_NEXT__','academic_release_id',(select ac from letter_test),'reason','Explicit reviewed promotion.','review_confirmed',true);p:=public.progression_preview(d);perform public.apply_progression_decision(d,p->>'preview_token','50000000-0000-4000-8000-000000000008');
 begin perform public.progression_preview(d||'{"source_year":"2026"}');raise exception 'FAIL duplicate year whitespace';exception when serialization_failure then null;end;
end $$;
reset role;
-- Full role denial matrix on valid restricted APIs, including legacy admin and revoked editor.
do $$declare actor text;begin
 foreach actor in array array['000000000004','000000000005','000000000006','000000000007','000000000008']loop
 perform set_config('request.jwt.claim.sub','20000000-0000-4000-8000-'||actor,true);
 begin perform public.class_letter_list('__LETTER_S1__');raise exception 'FAIL letter role denial %',actor;exception when insufficient_privilege then null;end;
 begin perform public.progression_context('__LETTER_A__');raise exception 'FAIL progression role denial %',actor;exception when insufficient_privilege then null;end;
 begin perform public.public_content_editor_state();raise exception 'FAIL unassigned/revoked public editor %',actor;exception when insufficient_privilege then null;end;
 begin perform public.staff_directory();raise exception 'FAIL staff directory role %',actor;exception when insufficient_privilege then null;end;
 end loop;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$begin begin perform public.progression_context('__LETTER_A__');raise exception 'FAIL officer progression';exception when insufficient_privilege then null;end;begin perform public.set_progression_threshold('2026',50);raise exception 'FAIL officer policy';exception when insufficient_privilege then null;end;end $$;
reset role;
set local role anon;
do $$declare p jsonb;begin p:=public.school_public_content();if(p->>'revision')::int<>2 or p::text like'%author_name%'or p::text like'%history%'then raise exception 'FAIL public reader whitelist';end if;begin perform public.class_letter_list('__LETTER_S1__');raise exception 'FAIL anonymous letter';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
