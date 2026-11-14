-- Public content is explicitly published plain text; school records never enter this API.
create table private.public_editors(user_id uuid primary key references public.profiles(id),granted_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
create table private.school_public_content(id boolean primary key default true check(id),revision integer not null default 0,content jsonb not null,updated_by uuid references public.profiles(id),updated_at timestamptz not null default now());
create table private.school_public_versions(id uuid primary key default gen_random_uuid(),revision integer not null unique,content jsonb not null,created_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
create index public_editors_grantor on private.public_editors(granted_by);
create index school_public_versions_author on private.school_public_versions(created_by);
alter table private.public_editors enable row level security;alter table private.school_public_content enable row level security;alter table private.school_public_versions enable row level security;
revoke all on private.public_editors,private.school_public_content,private.school_public_versions from public,anon,authenticated;
create policy public_editors_rpc_only on private.public_editors for all to anon,authenticated using(false)with check(false);
create policy public_content_rpc_only on private.school_public_content for all to anon,authenticated using(false)with check(false);
create policy public_versions_rpc_only on private.school_public_versions for all to anon,authenticated using(false)with check(false);
insert into private.school_public_content(content)values('{}');
create function private.can_edit_public_content()returns boolean language sql stable security definer set search_path=''as $$select private.has_school_role(array['headmaster'])or(private.has_school_role(array['dean','discipline_officer','teacher','discipline_staff'])and exists(select 1 from private.public_editors where user_id=auth.uid()));$$;
create function private.public_content_access()returns jsonb language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['headmaster','dean','discipline_officer','teacher','discipline_staff','student'])then raise exception 'Active school account required'using errcode='42501';end if;
 return jsonb_build_object('can_edit',private.can_edit_public_content());end;$$;
create function private.public_editor_grant(target_user uuid,enabled boolean)returns void language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 if enabled is null or not exists(select 1 from public.profiles p join public.user_roles r on r.user_id=p.id where p.id=target_user and p.is_active and r.role in('dean','discipline_officer','teacher','discipline_staff'))then raise exception 'Choose an active school staff account';end if;
 if enabled then insert into private.public_editors(user_id,granted_by)values(target_user,auth.uid())on conflict(user_id)do update set granted_by=excluded.granted_by,created_at=now();else delete from private.public_editors where user_id=target_user;end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,details)values(auth.uid(),'public_editor_access','profile',target_user::text,jsonb_build_object('enabled',enabled));
end;$$;
create function private.public_editor_list()returns jsonb language plpgsql security definer set search_path=''as $$begin
 if not private.has_school_role(array['headmaster'])then raise exception 'Headmaster access required'using errcode='42501';end if;
 return(select coalesce(jsonb_agg(jsonb_build_object('user_id',e.user_id,'name',p.display_name,'is_active',p.is_active,'granted_by',e.granted_by)order by p.display_name),'[]')from private.public_editors e join public.profiles p on p.id=e.user_id);end;$$;
create function private.public_content_editor_state()returns jsonb language plpgsql security definer set search_path=''as $$begin
 if not private.can_edit_public_content()then raise exception 'Public-page editor access required'using errcode='42501';end if;
 return(select jsonb_build_object('revision',revision,'content',content,'updated_at',updated_at,'updated_by',updated_by,'history',(select coalesce(jsonb_agg(to_jsonb(q)order by q.revision desc),'[]')from(select v.revision,v.created_at,p.display_name author_name from private.school_public_versions v join public.profiles p on p.id=v.created_by order by v.revision desc limit 30)q))from private.school_public_content where id);end;$$;
create function private.publish_public_content(content jsonb,expected_revision integer,review_confirmed boolean)returns integer language plpgsql security definer set search_path=''as $$
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
 return old.revision+1;
end;$$;
create function private.read_public_school_text()returns jsonb language sql stable security definer set search_path=''as $$select jsonb_build_object('revision',revision,'content',content,'updated_at',updated_at)from private.school_public_content where id;$$;
create function public.school_public_content()returns jsonb language sql stable security invoker set search_path=''as $$select private.read_public_school_text();$$;

create function public.public_content_access()returns jsonb language sql security invoker set search_path=''as $$select private.public_content_access();$$;
create function public.public_editor_grant(target_user uuid,enabled boolean)returns void language sql security invoker set search_path=''as $$select private.public_editor_grant(target_user,enabled);$$;
create function public.public_editor_list()returns jsonb language sql security invoker set search_path=''as $$select private.public_editor_list();$$;
create function public.public_content_editor_state()returns jsonb language sql security invoker set search_path=''as $$select private.public_content_editor_state();$$;
create function public.publish_public_content(content jsonb,expected_revision integer,review_confirmed boolean)returns integer language sql security invoker set search_path=''as $$select private.publish_public_content(content,expected_revision,review_confirmed);$$;
revoke all on function private.can_edit_public_content(),private.public_content_access(),private.public_editor_grant(uuid,boolean),private.public_editor_list(),private.public_content_editor_state(),private.publish_public_content(jsonb,integer,boolean),public.public_content_access(),public.public_editor_grant(uuid,boolean),public.public_editor_list(),public.public_content_editor_state(),public.publish_public_content(jsonb,integer,boolean)from public,anon;
grant execute on function private.public_content_access(),private.public_editor_grant(uuid,boolean),private.public_editor_list(),private.public_content_editor_state(),private.publish_public_content(jsonb,integer,boolean),public.public_content_access(),public.public_editor_grant(uuid,boolean),public.public_editor_list(),public.public_content_editor_state(),public.publish_public_content(jsonb,integer,boolean)to authenticated;
revoke all on function private.read_public_school_text(),public.school_public_content()from public;
grant execute on function private.read_public_school_text(),public.school_public_content()to anon,authenticated;
