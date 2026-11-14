begin;
do $$
declare bad text;
begin
 select string_agg(n.nspname||'.'||c.relname,', ') into bad
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','private') and c.relkind in ('r','v') and
 ((n.nspname='public' and c.relname<>'school_public_text' and
 (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('anon',c.oid,'INSERT') or has_table_privilege('anon',c.oid,'UPDATE') or has_table_privilege('anon',c.oid,'DELETE')))
 or (has_table_privilege('anon',c.oid,'TRUNCATE') or has_table_privilege('authenticated',c.oid,'TRUNCATE')
 or has_table_privilege('anon',c.oid,'TRIGGER') or has_table_privilege('authenticated',c.oid,'TRIGGER')
 or has_table_privilege('anon',c.oid,'REFERENCES') or has_table_privilege('authenticated',c.oid,'REFERENCES')));
 if bad is not null then raise exception 'Excessive client table permissions: %',bad; end if;
 if not has_table_privilege('anon','public.school_public_text','SELECT') then raise exception 'Public text read missing'; end if;
 if has_table_privilege('anon','public.school_public_text','UPDATE') then raise exception 'Public text writable'; end if;
 if not has_table_privilege('authenticated','public.profiles','SELECT') then raise exception 'Own profile read removed';end if;
 if not has_table_privilege('authenticated','public.attendance_records','UPDATE') then raise exception 'Guarded correction path removed';end if;
 if has_schema_privilege('anon','private','USAGE') then raise exception 'Anonymous private schema access';end if;
 if has_function_privilege('anon','public.student_login_target(text)','EXECUTE') then raise exception 'Anonymous login lookup';end if;
end $$;
set local role anon;
select count(*) as approved_public_text_count from public.school_public_text;
reset role;
-- Permission checks above never attempt TRUNCATE or change any school data.
rollback;
