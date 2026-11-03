# Attendance backend status — 3 November 2026

Applied to RUHUKA system (jsqiqxflgokfdooogcst): restrictive submitted-attendance guards; invoker-rights correct_main_attendance RPC with required reason; identity guard and before/after audit; transactional submit_main_attendance RPC for assigned active teachers, complete active roster validation and existing database unique class/day index.

Executed rollback-based SQL integration test using synthetic teacher/officer accounts: assigned teacher submits a complete register; duplicate submission raises unique violation; teacher direct update changes zero submitted rows; teacher correction RPC denied; officer changes absent to excused; before/after audit verified. Fixture transaction rolled back. Security advisor unchanged: leaked-password protection disabled.

Remaining: patron role and scope; auth/frontend integration; atomic submission as exclusive write path (legacy direct INSERT grants/policies still exist); complete roster edits/concurrency locking; draft lifecycle; correction reason UI and refresh; explanation review restrictions; multi-session concurrency and reconnect tests. Frontend still uses browser demo storage. Do not claim complete backend readiness.

Older migration baseline remains absent from this checkout; do not reset/rebuild a project from this folder alone.
