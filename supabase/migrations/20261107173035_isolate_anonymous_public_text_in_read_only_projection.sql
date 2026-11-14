-- Anonymous readers receive a dedicated public projection, never private-schema usage.
create table public.school_public_text(id boolean primary key default true check(id),revision integer not null,content jsonb not null,updated_at timestamptz not null);
alter table public.school_public_text enable row level security;
revoke all on public.school_public_text from public,anon,authenticated;
grant select on public.school_public_text to anon,authenticated;
create policy published_school_text_read on public.school_public_text for select to anon,authenticated using(true);
insert into public.school_public_text select id,revision,content,updated_at from private.school_public_content;
create or replace function public.school_public_content()returns jsonb language sql stable security invoker set search_path=''as $$select jsonb_build_object('revision',revision,'content',content,'updated_at',updated_at)from public.school_public_text where id;$$;
revoke all on function private.read_public_school_text()from public,anon,authenticated;

create or replace function private.publish_public_content(content jsonb,expected_revision integer,review_confirmed boolean)returns integer language plpgsql security definer set search_path=''as $$
declare old private.school_public_content;k text;v jsonb;begin
 if not private.can_edit_public_content()then raise exception 'Public-page editor access required'using errcode='42501';end if;
 if review_confirmed is distinct from true then raise exception 'Confirm that the school approved these public details';end if;
 if jsonb_typeof(content)is distinct from'object'or exists(select 1 from jsonb_object_keys(content)x where x not in('introduction','academics','activities','news','contact'))then raise exception 'Only approved public school text is allowed';end if;
 if(select count(*)from jsonb_object_keys(content))<>5 then raise exception 'Include all five public sections; leave unavailable text blank';end if;
 for k,v in select *from jsonb_each(content)loop if jsonb_typeof(v)is distinct from'string'or length(content->>k)>4000 then raise exception 'Public sections must be plain text up to 4000 characters';end if;end loop;
 select *into old from private.school_public_content where id for update;
 if old.revision is distinct from expected_revision then raise exception 'Another editor changed the website. Reload and compare before publishing.'using errcode='40001';end if;
 if old.content=content then return old.revision;end if;
 update private.school_public_content p set content=publish_public_content.content,revision=p.revision+1,updated_by=auth.uid(),updated_at=now()where id;
 insert into private.school_public_versions(revision,content,created_by)values(old.revision+1,content,auth.uid());
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'public_content_published','public_content',(old.revision+1)::text,jsonb_build_object('previous_revision',old.revision,'new_revision',old.revision+1,'school_approval_confirmed',true));
 insert into public.school_public_text(id,revision,content,updated_at)values(true,old.revision+1,content,now())on conflict on constraint school_public_text_pkey do update set revision=excluded.revision,content=excluded.content,updated_at=excluded.updated_at;
 return old.revision+1;
end;$$;
