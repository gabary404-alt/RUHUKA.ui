-- Existing per-user policies still apply to authenticated school operations.
-- Anonymous visitors can read only the approved public text projection.
revoke all privileges on all tables in schema public from anon;
grant select on public.school_public_text to anon;
revoke all privileges on all sequences in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke truncate, references, trigger on all tables in schema private from authenticated, anon;
-- Future tables created by the migration owner require deliberate client grants.
alter default privileges for role postgres in schema public revoke all privileges on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all privileges on sequences from anon, authenticated;
