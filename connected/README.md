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

## 7 November account and roster increment

Headmaster navigation now includes Staff accounts and Roster import. Staff invitations are handled by JWT-verified Supabase Edge Function staff-accounts; roles and account disabling use server-audited Headmaster RPCs. No Auth admin key is shipped to the browser. Staff recipients set their own password at account.html. Auth email delivery, production callback deployment and redirect allowlisting must be verified before invitations are used. No real invitations have been sent by this session.

Roster imports accept the downloadable CSV template (max 500 KB, 1000 rows). Before/after preview is read-only. Confirmation uses a server token for current roster state and actor-bound request ID to avoid a second application after a dropped response. Unsupported Excel files explain how to save as CSV. School-specific Excel parsing/officer grants remain unfinished.

Current server access is checked every 30 seconds while visible and when returning to the tab. Disabled or changed roles close the workspace without deleting attendance drafts. Supabase session validity remains a server permission check, independent of visible frontend controls. Physical devices, actual email, real role walkthrough and slow networks still require acceptance.

Release gate: current config disables staff invitation and recovery-email requests. Edge v3 additionally requires RUHUKA_STAFF_INVITES_ENABLED=true. Deploy/allowlist production account.html and verify email delivery before enabling the relevant client flags/server gate. Direct role management and CSV preview/apply do not depend on this email gate. The Headmaster directory and negative roster checks were verified live; no email or roster save was performed.

## Academic results and one-use roster access

Academic results navigation appears for Headmaster, Dean and teacher; only the Dean sees the upload/correction editor. CSV headers: student_id, subject/maximum columns, overall_percent last. Check → inspect proposed ranks/marks/warnings → fix CSV or supply warning reason → Publish. Native student disclosures keep long classes compact and create subject detail DOM only when opened. School formats and real Dean acceptance remain open.

Corrections preserve the original release, publication ranks and original class/year cohort, even if students later move/leave. The roster-ID helper uses the selected release cohort during correction. The Headmaster receives a notice with a direct release link; students receive own rows in My records. No AI context is sent.

Headmaster staff cards allow/revoke one successful roster import for an active officer within 24 hours. Officer Roster import explains permission and lets the officer refresh after approval. Preview failures do not consume the grant. An uncertain successful response can retry the same actor/request/payload after permission is consumed. Real parallel transaction acceptance remains C11.

## Official discipline and reports

Discipline records: Officer uploads discipline-totals-template.csv and optional discipline-events-template.csv, names/dates the class snapshot and identifies the official source. Totals must include every required student once. Events are evidence, not deductions. The server checks and atomically applies the preview; no separate reviewer. Corrections preserve older versions/cohort/year and omitted event evidence. Headmaster reads imports; officer edits only through reviewed replacement files. Notifications open the exact source and unread updates appear on Today.

Reports: Main attendance or one academic/discipline release, class/date filters, CSV for Excel and native Print/save-as-PDF. Loaded snapshot is the export source; changed filters invalidate it. Missing is not zero, private fields are absent. Wide academic printing uses subject rows. Physical print/phone and real-role acceptance remain open.

School desk: Administrator class/year history shows latest 500 immutable states. Headmaster can review/confirm a class-year change using expected current year and reason; no student promotion. Attendance confirmation rechecks membership and keeps remaining marks when reopening a changed roster.

## Class letters, manual year-end review and school text

Class letters appears for Headmaster/Dean/Officer; it loads on demand. Dean/Officer generates from explicit source releases, reviews separate explanation and saves immutable school snapshot/version; Headmaster reads/notified. Native portrait print retains source evidence; actual school/device/print acceptance remains open. Year-end promote/repeat and named public editing sit in expandable School desk sections and load only when opened. Manual threshold highlights review only. Public editing is Headmaster/named-active-staff only, school-approval-confirmed, stale-safe and audited; anonymous readers receive only the approved-text projection. No real public facts were added.

Role walkthrough: guide.html. Operational setup/recovery and release gates: ../OPERATIONS_AND_HANDOVER.md and ../RELEASE_PLAN.md. Invitations/reset requests remain gated; no student-device dependency is introduced.
