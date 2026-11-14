
create or replace function private.valid_note_checklist(value jsonb)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
begin
 if jsonb_typeof(value) is distinct from 'array' then return false; end if;
 if jsonb_array_length(value)>200 then return false; end if;
 return not exists(select 1 from jsonb_array_elements(value) item where
 jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'text') is distinct from 'string'
 or length(item->>'text')>1000 or jsonb_typeof(item->'done') is distinct from 'boolean');
end;
$$;
revoke all on function private.valid_note_checklist(jsonb) from public,anon;
grant execute on function private.valid_note_checklist(jsonb) to authenticated;

create table public.personal_notebooks(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 80),
 created_at timestamptz not null default now(),
 unique(id,owner_id)
);
create index personal_notebooks_owner_idx on public.personal_notebooks(owner_id);
create table public.personal_notes(
 id uuid primary key default gen_random_uuid(),
 notebook_id uuid not null,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null default '' check(length(title)<=100),
 body text not null default '' check(length(body)<=100000),
 checklist jsonb not null default '[]'::jsonb check(private.valid_note_checklist(checklist)),
 revision bigint not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(notebook_id,owner_id) references public.personal_notebooks(id,owner_id) on delete cascade
);
create index personal_notes_owner_notebook_idx on public.personal_notes(owner_id,notebook_id,updated_at desc);
alter table public.personal_notebooks enable row level security;
alter table public.personal_notes enable row level security;
revoke all on public.personal_notebooks,public.personal_notes from anon,authenticated;
grant select,insert,update on public.personal_notebooks to authenticated;
grant select,insert,update,delete on public.personal_notes to authenticated;

create policy notebook_owner on public.personal_notebooks for all to authenticated
using(owner_id=(select auth.uid()) and private.has_school_role(array['teacher','discipline_staff','discipline_officer','dean','headmaster']))
with check(owner_id=(select auth.uid()) and private.has_school_role(array['teacher','discipline_staff','discipline_officer','dean','headmaster']));
create policy note_owner on public.personal_notes for all to authenticated
using(owner_id=(select auth.uid()) and private.has_school_role(array['teacher','discipline_staff','discipline_officer','dean','headmaster']))
with check(owner_id=(select auth.uid()) and private.has_school_role(array['teacher','discipline_staff','discipline_officer','dean','headmaster']));

create or replace function private.bump_personal_note_revision()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.created_at is distinct from old.created_at then
 raise exception 'Note identity cannot be changed'; end if;
 new.revision:=old.revision+1; new.updated_at:=clock_timestamp(); return new;
end;
$$;
revoke all on function private.bump_personal_note_revision() from public,anon,authenticated;
create trigger personal_note_revision before update on public.personal_notes
for each row execute function private.bump_personal_note_revision();

create or replace function public.save_personal_note(note_id uuid,expected_revision bigint,note_title text,note_body text,note_checklist jsonb)
returns public.personal_notes language plpgsql security invoker set search_path='' as $$
declare saved public.personal_notes;
begin
 update public.personal_notes set title=note_title,body=note_body,checklist=note_checklist
 where id=note_id and revision=expected_revision returning * into saved;
 if not found then raise exception 'Note changed on another device or is no longer accessible. Reload before saving.' using errcode='40001'; end if;
 return saved;
end;
$$;
revoke all on function public.save_personal_note(uuid,bigint,text,text,jsonb) from public,anon;
grant execute on function public.save_personal_note(uuid,bigint,text,text,jsonb) to authenticated;
