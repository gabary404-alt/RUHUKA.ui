create function private.advance_class_year(target_class text,expected_year text,next_year text,reason text)returns void language plpgsql security definer set search_path=''as $$
declare previous_year text;begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 if coalesce(length(btrim(next_year)),0)not between 1 and 30 or coalesce(length(btrim(reason)),0)not between 1 and 1000 then raise exception 'Provide the new school year and a reason';end if;
 select academic_year into previous_year from public.school_classes where class_name=target_class for update;if not found then raise exception 'Class not found';end if;
 if previous_year is distinct from expected_year then raise exception 'School year changed. Review the current class year again.'using errcode='40001';end if;
 if previous_year=btrim(next_year)then raise exception 'Choose a different school year';end if;
 update public.school_classes set academic_year=btrim(next_year)where class_name=target_class;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'class_year_changed','school_class',target_class,jsonb_build_object('previous_year',previous_year,'next_year',btrim(next_year),'reason',btrim(reason),'automatic_promotion',false));
end;$$;
create function public.advance_class_year(target_class text,expected_year text,next_year text,reason text)returns void language sql security invoker set search_path=''as $$select private.advance_class_year(target_class,expected_year,next_year,reason);$$;
revoke all on function private.advance_class_year(text,text,text,text),public.advance_class_year(text,text,text,text)from public,anon;
grant execute on function private.advance_class_year(text,text,text,text),public.advance_class_year(text,text,text,text)to authenticated;
