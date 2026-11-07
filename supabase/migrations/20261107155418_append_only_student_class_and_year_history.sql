-- Append-only enrolment/year evidence from this migration onward. Never invent older membership dates.
create table private.student_enrolment_history(
 id uuid primary key default gen_random_uuid(),student_id text not null references public.students(student_id),
 event text not null,previous_state jsonb,next_state jsonb,actor_id uuid references public.profiles(id),recorded_at timestamptz not null default clock_timestamp()
);
create index enrolment_history_student_time on private.student_enrolment_history(student_id,recorded_at desc,id);
alter table private.student_enrolment_history enable row level security;
revoke all on private.student_enrolment_history from public,anon,authenticated;
create policy enrolment_history_rpc_only on private.student_enrolment_history for all to anon,authenticated using(false)with check(false);
insert into private.student_enrolment_history(student_id,event,next_state)
 select s.student_id,'baseline',jsonb_build_object('full_name',s.full_name,'class_name',s.class_name,'academic_year',c.academic_year,'status',s.status)from public.students s left join public.school_classes c on c.class_name=s.class_name;
create function private.record_enrolment_change()returns trigger language plpgsql security definer set search_path=''as $$
declare before_state jsonb;after_state jsonb;begin
 if tg_op='UPDATE'and old.class_name is not distinct from new.class_name and old.status is not distinct from new.status and old.full_name is not distinct from new.full_name then return new;end if;
 if tg_op='UPDATE'then before_state:=jsonb_build_object('full_name',old.full_name,'class_name',old.class_name,'academic_year',(select academic_year from public.school_classes where class_name=old.class_name),'status',old.status);end if;
 after_state:=jsonb_build_object('full_name',new.full_name,'class_name',new.class_name,'academic_year',(select academic_year from public.school_classes where class_name=new.class_name),'status',new.status);
 insert into private.student_enrolment_history(student_id,event,previous_state,next_state,actor_id)values(new.student_id,case when tg_op='INSERT'then'added'else'changed'end,before_state,after_state,auth.uid());return new;
end;$$;
create trigger student_enrolment_change after insert or update on public.students for each row execute function private.record_enrolment_change();
create function private.record_class_year_change()returns trigger language plpgsql security definer set search_path=''as $$begin
 if old.academic_year is distinct from new.academic_year then
 insert into private.student_enrolment_history(student_id,event,previous_state,next_state,actor_id)
 select s.student_id,'class_year_changed',jsonb_build_object('full_name',s.full_name,'class_name',old.class_name,'academic_year',old.academic_year,'status',s.status),jsonb_build_object('full_name',s.full_name,'class_name',new.class_name,'academic_year',new.academic_year,'status',s.status),auth.uid()from public.students s where s.class_name=new.class_name;
 end if;return new;end;$$;
create trigger class_year_enrolment_change after update of academic_year on public.school_classes for each row execute function private.record_class_year_change();
revoke all on function private.record_enrolment_change(),private.record_class_year_change()from public,anon,authenticated;
create function private.student_enrolment_history(target_student text)returns jsonb language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['headmaster','dean','discipline_officer'])then raise exception 'School administrator access required'using errcode='42501';end if;
 return jsonb_build_object('student_id',target_student,'coverage','History starts when recording was enabled. Baseline is a current-state snapshot, not proof of older enrolment dates. Earlier attendance and published results retain their own source records.','events',(select coalesce(jsonb_agg(to_jsonb(q)order by q.recorded_at desc,q.id),'[]')from(select h.id,h.event,h.previous_state,h.next_state,h.recorded_at,h.actor_id,p.display_name actor_name from private.student_enrolment_history h left join public.profiles p on p.id=h.actor_id where h.student_id=target_student order by h.recorded_at desc,h.id limit 500)q));
end;$$;
create function public.student_enrolment_history(target_student text)returns jsonb language sql security invoker set search_path=''as $$select private.student_enrolment_history(target_student);$$;
revoke all on function private.student_enrolment_history(text),public.student_enrolment_history(text)from public,anon;
grant execute on function private.student_enrolment_history(text),public.student_enrolment_history(text)to authenticated;
