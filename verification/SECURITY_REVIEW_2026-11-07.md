# I05 technical security review — 7 November 2026

Scope: current integration source, active RUHUKA system database and available recent Supabase logs. This is a technical review with findings, not a penetration-test certification or approval to deploy to a school.

## Finding corrected
Legacy grants allowed anonymous roles to reach school tables (RLS still restricted rows) and ordinary authenticated roles retained TRUNCATE/REFERENCES/TRIGGER privileges. TRUNCATE is not a normal browser REST operation and no exploit is claimed, but row policies do not replace least-privilege object grants.

Applied additive migration 20261107194133:
- Revoked anonymous privileges on existing public tables/views and sequences; restored SELECT only on school_public_text, the approved public-text projection.
- Revoked maintenance privileges TRUNCATE/REFERENCES/TRIGGER on public/private tables from authenticated clients and on private tables from anonymous clients.
- Removed automatic anon/authenticated table/sequence privileges for future postgres-owned public objects. Other platform object creators still require review; no claim is made that every platform-wide default has changed.
- Preserved existing authenticated row-level operations, service-role access, data, history and audit actors. No records were deleted, truncated, sent or imported.

## Reviewed evidence
- All public/private ordinary tables have RLS enabled. Public main_attendance_stats view uses security_invoker. Sensitive private tables use deny policies/no direct client grants and scoped RPC boundaries; restrictive policies protect existing permissive legacy policy combinations.
- Anonymous private schema USAGE is false. Public SECURITY DEFINER exception is platform rls_auto_enable event trigger; anonymous execution false. No custom definer lacks configured search_path. Public authentication target/rate/consume/finish RPCs deny anonymous/authenticated execution. Student/account and prior multi-role rollback suites provide role-boundary evidence.
- Only intended anonymous data-returning application RPC is school_public_content. Existing trigger functions cannot be invoked as ordinary data-returning functions. No Storage buckets exist, so there is no active public file bucket to leak records.
- Scanned repository JS/TS/HTML/JSON for secret-style keys/JWT literals; no candidate credential files found. Frontend uses a publishable key; AI/Auth admin keys are server environment lookups. No raw credential values were read from service configuration. Pattern matching is not proof that no conceivable secret exists.
- Application server adapters import only local chat policy; Edge handlers have no third-party package imports. No application package/lock manifest or remotely loaded script tags were found. Therefore no installed application npm dependency graph exists to run npm audit against. Node/Deno/Vercel runtimes remain provider-managed; runtime and any future package updates must be reviewed before deployment.
- Handlers return selected fields/generic failures and do not log request bodies, passwords, codes, session tokens or raw upstream diagnostics. AI carries bounded conversation only, no database client/action tools. Existing tests cover private-data refusal and sanitised error responses. Browser downloads/printed files remain private-data handling responsibilities after export.
- Bounded available Supabase 24-hour log scan aggregated 601 events across eight sources. Pattern checks found zero candidate secret-key/JWT/password/token/authorization values in log_attributes; no raw log bodies or matching credential values were exported. Empty matches are limited to available fields, retained window and patterns, not a proof about all historical logs.
- Current Supabase security advisor reports only the existing leaked-password-protection warning. B14 retains this setting/email/rate acceptance; no paid Auth capability was silently enabled. Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Verification
least_privilege.sql rollback checks pass: no unintended anonymous read/write grants, no client maintenance privileges, anonymous approved text read works, authenticated profile read/correction privileges retained, private schema/lookup denied. It does not attempt destructive TRUNCATE statements. student_access.sql and class_letters_public_progression.sql reran successfully after migration; synthetic fixtures rolled back. 165 Node tests pass. All 61 applied migration files match recorded source checksums.

I05 is technically complete. Separate open items remain: B14 Auth settings, H02 durable AI abuse/cost controls, I04 environment isolation, I06 operational monitoring, I07/I08 recovery, actual multi-role/phone/print and school acceptance. Production source stays unchanged; pilot database has this authorised hardening. PR #10 remains draft. Tracker: 76 verified + 40 open + 12 deferred = 128.
