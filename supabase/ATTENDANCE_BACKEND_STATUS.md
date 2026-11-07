# Attendance backend status — 3 November 2026

Applied to RUHUKA system (jsqiqxflgokfdooogcst). New main attendance must use validated transactional submit_main_attendance. Public invoker wrapper calls a private SECURITY DEFINER implementation with explicit active role and class-assignment checks. Authenticated direct main session/record inserts are blocked by restrictive policies; follow-up insert policies are retained.

Patrons/matrons use discipline_staff role: school-wide attendance submission and roster/attendance reading, no correction permission. No actual users were granted this role.

main_attendance_overview provides class/date submission coverage, submitter UUID/time and mark counts, respecting caller RLS. Frontend attendance-service.js maps screen records to RPC arguments and rejects failures without pretending a demo save succeeded. Adapter is not loaded into the live page yet; auth/client setup is next.

Executed rollback SQL suite: assigned teacher complete submission; duplicate register rejection; incomplete/wrong-class/invalid-status/duplicate-student rejection; authenticated direct insert blocked; teacher submitted mark update blocked and correction RPC denied; officer excused correction with before/after audit; patron valid submission and overview; patron correction denied. All fixtures rolled back.

Remaining: real sign-in and screen integration; concurrent two-connection race tests; roster lifecycle/concurrent roster mutation locking; explanation visibility/review restrictions; date/year rollover; realtime subscriptions and reconnect refresh; follow-up validation. No school-ready or shared-screen claim. Security advisor retains leaked-password-protection warning.

Historical migration baseline remains incomplete in this checkout. Do not reset/rebuild another database solely from this folder.
