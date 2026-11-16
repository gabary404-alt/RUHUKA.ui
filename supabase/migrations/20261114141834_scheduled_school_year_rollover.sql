-- School calendar rollover only; never a student promotion decision.
create table public.school_year_rollovers (
 source_year text primary key,
 next_year text not null check(length(btrim(next_year)) between 1 and 30 and source_year<>next_year),
 enabled boolean not null default true,
 scheduled_by uuid not null references public.profiles(id),
 scheduled_at timestamptz not null default now(),
 completed_at timestamptz,
 classes_changed integer,
 check(length(btrim(source_year)) between 1 and 30)
);
alter table public.school_year_rollovers enable row level security;
revoke all on public.school_year_rollovers from public,anon,authenticated;
grant select on public.school_year_rollovers to authenticated;
create policy rollover_headmaster_read on public.school_year_rollovers for select to authenticated using(private.has_school_role(array['headmaster']));

create function private.schedule_school_year_rollover(source_year text,next_year text,enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
declare term_end date;begin
 if not private.has_school_role(array['headmaster']) then raise exception 'Headmaster access required' using errcode='42501';end if;
 if enabled is null then raise exception 'Choose whether to enable the year change';end if;
 perform pg_advisory_xact_lock(hashtextextended('ldk-year-rollover',0));
 if exists(select 1 from public.school_year_rollovers r where r.source_year=$1 and r.completed_at is not null) then raise exception 'This year change is already complete';end if;
 if not enabled then
  update public.school_year_rollovers r set enabled=false where r.source_year=$1;
  if not found then raise exception 'No scheduled change for this year';end if;
 else
  if coalesce(length(btrim(next_year)),0) not between 1 and 30 or btrim(next_year)=source_year then raise exception 'Enter a different next school year';end if;
  select t.ends_on into term_end from public.school_terms t where t.academic_year=$1 and t.term_number=3;
  if term_end is null then raise exception 'Set Term 3 dates for the current school year first';end if;
  if term_end<(now() at time zone 'Africa/Kigali')::date then raise exception 'Term 3 already ended. Review the class years manually before scheduling a future change';end if;
  if not exists(select 1 from public.school_classes c where c.academic_year=$1) then raise exception 'No classes use this school year';end if;
  if exists(select 1 from public.school_terms t where t.academic_year=btrim($2) and t.term_number=1 and t.starts_on<=term_end) then raise exception 'Next year starts before the current year ends';end if;
  insert into public.school_year_rollovers(source_year,next_year,scheduled_by)values($1,btrim($2),auth.uid())
  on conflict on constraint school_year_rollovers_pkey do update set next_year=excluded.next_year,enabled=true,scheduled_by=excluded.scheduled_by,scheduled_at=now();
 end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'school_year_rollover_configured','school_year',source_year,jsonb_build_object('next_year',next_year,'enabled',enabled));
end;$$;
create function public.schedule_school_year_rollover(source_year text,next_year text,enabled boolean) returns void language sql security invoker set search_path='' as $$select private.schedule_school_year_rollover(source_year,next_year,enabled);$$;
revoke all on function private.schedule_school_year_rollover(text,text,boolean),public.schedule_school_year_rollover(text,text,boolean) from public,anon;
grant execute on function private.schedule_school_year_rollover(text,text,boolean),public.schedule_school_year_rollover(text,text,boolean) to authenticated;

-- Owner-only scheduler. No client may call it or supply a date to force rollover.
create function private.run_school_year_rollovers() returns integer language plpgsql security invoker set search_path='' as $$
declare plan record;class_row record;changed integer;total integer:=0;begin
 perform pg_advisory_xact_lock(hashtextextended('ldk-year-rollover',0));
 for plan in select r.* from public.school_year_rollovers r join public.school_terms t on t.academic_year=r.source_year and t.term_number=3
  where r.enabled and r.completed_at is null and t.ends_on<(now() at time zone 'Africa/Kigali')::date
  order by r.source_year for update of r
 loop
  changed:=0;
  for class_row in select c.class_name,c.academic_year from public.school_classes c where c.academic_year=plan.source_year order by c.class_name for update loop
   update public.school_classes set academic_year=plan.next_year where class_name=class_row.class_name;
   insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(plan.scheduled_by,'class_year_changed_automatically','school_class',class_row.class_name,jsonb_build_object('previous_year',plan.source_year,'next_year',plan.next_year,'executed_by','scheduled_job','authorised_by',plan.scheduled_by,'automatic_promotion',false));
   changed:=changed+1;
  end loop;
  update public.school_year_rollovers set completed_at=clock_timestamp(),classes_changed=changed,enabled=false where source_year=plan.source_year;
  total:=total+changed;
 end loop;
 return total;
end;$$;
revoke all on function private.run_school_year_rollovers() from public,anon,authenticated,service_role;
create extension if not exists pg_cron;
-- 22:05 UTC = 00:05 Kigali; compare dates in Kigali even if DB timezone differs.
select cron.schedule('ldk-school-year-rollover','5 22 * * *','select private.run_school_year_rollovers()');
