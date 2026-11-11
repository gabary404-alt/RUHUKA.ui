"""Emit an isolated, rollback-only schema replay for a Supabase SQL editor.

The replay renames the application schemas, stubs the platform Auth objects and
does not attach its tables to Realtime. It reads no application table data.
"""
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[2]
db = root / "supabase"
inventory = json.loads((db / "MIGRATION_INVENTORY.json").read_text())
paths = []
for entry in inventory:
    path = root / entry["path"]
    if hashlib.sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
        raise SystemExit(f"Checksum mismatch: {path.name}")
    if path.parent.name == "migrations":
        paths.append(path)
assert paths and paths[0].name.startswith("20261020165638_")
if sys.argv[1:] == ["--hosted-test"]:
    # Fresh managed Auth/Realtime objects already exist. Refuse any project
    # containing application tables or accounts before applying the baseline.
    print("""do $$ begin
    if exists(select 1 from pg_tables where schemaname in ('public','private'))
       or exists(select 1 from auth.users) then
      raise exception 'Expected an empty isolated test project';
    end if;
    end $$;""")
    for index, path in enumerate(paths):
        sql = path.read_text()
        if index == 0:
            sql = re.sub(r"(?im)^drop table if exists public\.[a-z_]+ cascade;\n", "", sql)
        if path.name.startswith("20261026190220_"):
            print("alter table public.students add column student_email text, add column student_phone text;")
            sql = sql.replace(
                "revoke all on function public.rls_auto_enable() from public, anon, authenticated;",
                """do $$ begin
                if to_regprocedure('public.rls_auto_enable()') is not null then
                  revoke all on function public.rls_auto_enable() from public, anon, authenticated;
                end if;
                end $$;""",
            )
        print(f"\n-- {path.name}\n{sql}")
    print("notify pgrst, 'reload schema';")
    sys.exit(0)
if len(sys.argv) != 1:
    raise SystemExit("Use no arguments for schema replay or --hosted-test for a fresh test project.")

names = {schema: f"ruhuka_replay_{schema}" for schema in ("public", "private", "auth")}

print("""begin;
set local lock_timeout='3s';
set local statement_timeout='90s';
create schema ruhuka_replay_public;
create schema ruhuka_replay_auth;
create table ruhuka_replay_auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create table ruhuka_replay_auth.sessions(id uuid primary key,user_id uuid references ruhuka_replay_auth.users(id),not_after timestamptz);
create function ruhuka_replay_auth.jwt() returns jsonb language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
create function ruhuka_replay_auth.uid() returns uuid language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),ruhuka_replay_auth.jwt()->>'sub')::uuid $$;
create function ruhuka_replay_public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin return; end; $$;
grant usage on schema ruhuka_replay_public,ruhuka_replay_auth to anon,authenticated,service_role;
alter default privileges in schema ruhuka_replay_public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema ruhuka_replay_public grant execute on functions to anon,authenticated,service_role;
alter default privileges in schema ruhuka_replay_public grant all on sequences to anon,authenticated,service_role;
""")

for path in paths:
    if path.name.startswith("20261026190220_"):
        # The migration copied these legacy contact columns and then dropped
        # them. The recorded reset omitted their earlier creation.
        print("alter table ruhuka_replay_public.students add column student_email text, add column student_phone text;")
    sql = path.read_text()
    sql = re.sub(r'(?<![a-zA-Z0-9_])"?(public|private|auth)"?\.', lambda m: names[m[1]]+".", sql)
    sql = re.sub(r'(?i)(\bschema\s+(?:if not exists\s+)?)(public|private|auth)\b',
                 lambda m: m[1]+names[m[2].lower()], sql)
    sql = re.sub(r'(?i)(\bsearch_path\s*(?:=|to)\s*)(public(?:,\s*auth)?)(?=\s|;)',
                 lambda m: m[1]+", ".join(names[v.strip().lower()] for v in m[2].split(",")), sql)
    sql = re.sub(r"(\b(?:schemaname|nspname)\s*=\s*)'(public|private)'",
                 lambda m: m[1]+"'"+names[m[2]]+"'", sql)
    sql = sql.replace("supabase_realtime", "ruhuka_replay_realtime_absent")
    if re.search(r"(?m)^\s*(commit|rollback)\s*;", sql, re.I):
        raise SystemExit(f"Unexpected transaction command: {path.name}")
    print(f"\n-- Replay {path.name}\n{sql}\n")

print("""
with inventory as (
 select table_schema,table_name,column_name,is_nullable,data_type,udt_name,
        character_maximum_length,numeric_precision,numeric_scale
 from information_schema.columns
 where table_schema in ('public','private','ruhuka_replay_public','ruhuka_replay_private')
), live as (
 select * from inventory where table_schema in ('public','private')
), replay as (
 select replace(table_schema,'ruhuka_replay_','') table_schema,table_name,column_name,is_nullable,data_type,udt_name,
        character_maximum_length,numeric_precision,numeric_scale
 from inventory where table_schema like 'ruhuka_replay_%'
), live_only as (select * from live except select * from replay),
replay_only as (select * from replay except select * from live)
select jsonb_build_object(
 'live_columns',(select count(*) from live),
 'replayed_columns',(select count(*) from replay),
 'live_only',(select coalesce(jsonb_agg(to_jsonb(l)),'[]') from live_only l),
 'replay_only',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from replay_only r),
 'replay_functions',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('ruhuka_replay_public','ruhuka_replay_private'))
) as schema_replay;
rollback;
""")
