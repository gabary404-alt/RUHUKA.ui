# Attendance backend status

Applied to RUHUKA system (jsqiqxflgokfdooogcst), 3 November 2026.

Migration 20261103174849 adds restrictive UPDATE guards for submitted main attendance. Existing permissive policies remain, but cannot independently authorize a teacher/headmaster to update submitted main records. Submitted main session headers are immutable to authenticated clients.

Verified migration history and policy catalog; security advisor reports only the pre-existing leaked-password-protection warning. End-to-end role tests remain outstanding. Existing officer correction constraints still only permit the late-return present path; broader corrections require reconciliation. This is an incremental restriction, not a finished attendance API.

Existing database already has a partial unique index on main class/date. Still required: atomic submission with full roster validation; separate patron role; correction reason and before/after history; explanation access restriction; authentication integration; realtime view refresh and reconnect; multi-session permission/concurrency tests.

Website remains local demo. No student rows altered. Historical migrations are not all in this checkout: do not reset/rebuild from this folder alone. Reconcile older migration baseline first.
