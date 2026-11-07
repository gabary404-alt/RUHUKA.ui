# RUHUKA school workspace pilot
Updated 7 November 2026.

The public page links directly to /connected/. Sign in with the assigned account email; the database supplies the real active role. There is no public demo-role chooser. Tokens remain in memory; refresh/signout handling clears visible private data.

## Active navigation
Staff/Admin: Today, Attendance, School desk and Sign out. Students: My records and School desk announcements. Each button opens one clear panel. Forms in School desk expand only when needed. Students cannot submit absence explanations, and no role has a Notebook entry point in the active workspace.

## Attendance
Teachers use assigned classes; patrons/matrons use the school-wide classes allowed by the database. Main attendance is unique per class/day, reviewed before confirmation, and submitted atomically. Device drafts are user/class/day scoped. Reconnect detects an already-submitted register without uploading a draft. Follow-up lessons are separate and excluded from official main totals. Discipline Officers can correct submitted main marks with a reason and before/after history.

## Today
Permitted missing registers, attendance/academic/discipline follow-ups, upload-status details and priority notices open their retained actions. No student-explanation task is returned or rendered. Counts poll every five seconds while the panel is visible; concern scans run approximately every 30 seconds. Upload details are read-only until complete import workflows are connected.

## Student records
The zero-argument my_student_records RPC checks an active student role and its linked student record. It returns only own attendance and applied-source academic/discipline information. Missing is not zero; zero subject marks remain zero. Full named releases/rankings remain unfinished.

## Preserved postponed features
Notebook code/private tables and old device notes are retained for later; the active website does not load or mount them. Historical absence explanations remain private. New submissions are blocked by the submission function and restrictive INSERT policy. Manual officer corrections and historical officer review functions remain intact.

## Verification boundaries
See verification/RESUMED_TEN_ITEMS_2026-11-07.md and supabase/tests/daily_followup.sql. Unit/mocked tests and SQL rollback fixtures are not physical-device or school acceptance. Real phone keyboard, slow network, full multi-user workflow, account setup/recovery, complete imports and school acceptance remain open. No production merge is authorised by this document.
