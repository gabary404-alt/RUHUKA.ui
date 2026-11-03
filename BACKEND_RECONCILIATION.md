# Backend reconciliation — 3 November 2026

Approved scope: real shared workflows first; retain AI; defer parent messaging, SMS, automatic promotion decisions, advanced charts/school-wide leaderboards and elaborate interactive 3D. Lightweight illustrations approved. Add named notebook collections without losing existing notes.

Read-only Supabase inspection: active project jsqiqxflgokfdooogcst, 16 public tables with RLS, school tables empty, 13 migrations. No schema mutations performed in this review.

Conflicts to fix before enabling real users:
- attendance_records_teacher_update and attendance_sessions_staff_update permit teachers and headmaster/admin updates; submitted corrections must be Discipline Officer-only.
- workflow_read_parties_and_staff and workflow_staff_decide expose/allow decisions on absence explanations to broader staff than approved.
- import_batches policies omit Dean while permitting broad import types for other admins.
- discipline import flow and legacy schema assume reviewer approval, superseded by notification-only approval requirements.
- establish discipline staff/patron role separately from Discipline Officer.

Next implementation: reconcile helpers, role constraints, triggers and existing unique indexes; introduce transactional submit/correct operations with durable audit, role tests and concurrent duplicate tests. Connect real auth and roster before enabling shared attendance. Then subscribe authorized officer views to committed updates with reconnect refresh. No shared attendance completion claim until verified on two sessions.

Notebook collection change: existing notes remain in default My notebook; named collection metadata persisted separately; no backend privacy claim. Manual browser verification and dedicated collection tests remain pending.
