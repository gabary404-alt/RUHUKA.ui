# Ruhuka — agreed first functional handover

Decisions confirmed by the project owner through 2026-11-03 (Africa/Kigali).
This document supersedes conflicting older briefs and the frontend-only handover
scope in RUHUKA_MASTER_HANDOFF.md. Requirements below are not implementation claims.

## Delivery and design

- Build and verify frontend and backend together in complete workflows using
  synthetic test records, as approved 3 November. The actual school handover requires a functioning backend.
- Preserve the current green/red identity and existing first-release features,
  including notebooks and AI help. Prioritize phones while supporting desktop.
- English first. Other languages will be directed by the owner later.
- Exactly three portals: Student, Staff and Admin. Parent portal is deferred.
- Keep tasks short and understandable; school staff should operate daily without
  a developer. Ongoing support is expected.

## Roles and permissions

| Role | Agreed responsibilities |
| --- | --- |
| Student | Own results, separate academic/discipline class rankings, attendance, absence explanations, announcements |
| Academic Staff (teachers) | Assigned-class attendance, read-only student lookup, assigned-class announcements, notebook |
| Discipline Staff (patrons/matrons) | School-wide attendance, read-only lookup, notebook; no discipline imports or clearing concerns |
| Discipline Officer (Admin) | Attendance corrections, absence review, discipline imports, concerns, individual student additions, reset codes, announcements |
| Dean of Studies (Admin) | Academic imports/corrections, teacher assignments, promotion review/settings, announcements |
| Headmaster (Admin) | Roster, staff accounts/roles, teacher assignments, delegated permissions, term dates, reports/oversight, announcements |

- Only Discipline Officers correct submitted attendance, including midday returns.
  This supersedes the earlier suggestion that patrons/matrons could correct it.
- Headmaster manages edits to names/classes and transferred/archived statuses.
  Discipline Officers request those corrections.
- Discipline Officers add individual students directly; notify the Headmaster
  with HIGH priority. No additional grant is required.
- Whole-roster import by a Discipline Officer requires a Headmaster grant to that
  officer. It is consumed by ONE successful import, not failed validation/upload.
- Permissions are specific actions, not an unrestricted superuser switch.
- Public content editing is allowed to the Headmaster and named editors/developers
  authorized by the school. Developer status alone grants no access.
- UI visibility is not authorization. These rules must be enforced server-side
  during integration, with per-role tests and audit records.

## Attendance and explanations

- One main attendance per class per school-local date. A teacher or patron normally
  submits it. Follow-up lesson registers do not affect official daily statistics.
- Reject a second main submission with a clear already-submitted message. Preserve
  the existing register, including when two people submit concurrently.
- Discipline Officers can correct submitted records. Preserve before/after values,
  reason, authenticated editor and timestamp. Present with a late-arrival explanation
  differs from an excused absence.
- Discipline Office overview lists submitted/missing class registers by date and
  shows the submitter and time. Missing registers are not student absences.
- Students can submit explanations with optional photo/PDF proof. Send only to
  Discipline Officers. Approval changes the linked absence to excused with history.
- Save drafts on the device through connectivity loss, scoped to the signed-in
  user. Show Not submitted until server confirmation. Recheck duplicate submissions
  on reconnect; do not silently overwrite someone else's register.
- Flag five consecutive recorded main-attendance school days absent. Missing
  attendance is unknown, never automatically absent. Present/late/excused ends
  the streak. An existing concern stays open until reviewed.
- After closure, another absent day reopens a concern if the student has not
  returned; after return, a new five-day streak creates a new concern.
- Academic below 50% and official discipline below 20/40 remain separate concerns.
  Clearing one category does not clear the others. No automated disciplinary action.

## Academics, reports and promotion

- Dean names a results release freely and uploads whenever needed, e.g. Beginning
  of Term Tests. Preserve earlier releases and separate their rankings.
- Upload has one student per row, individual subject marks and an overall percentage
  in the last column. Subjects may have different maximum marks.
- Overall calculation: sum earned marks / sum possible marks * 100. Use the
  school-supplied overall for rankings; surface discrepancies rather than silently
  replacing it. Blank is Not recorded; explicit zero is a valid recorded mark.
- Warn the Dean about missing marks. Allow Review/fix or Publish anyway; retain
  unresolved warnings and record the override. Published students WITH a supplied
  overall percentage remain ranked even with a blank subject mark.
- Academic and discipline rankings remain separate, within the student's own class.
  Ties share positions (1,2,2,4). Never silently treat a missing total as zero.
- Dean publishes and corrects results without Headmaster approval. Notify Headmaster
  on uploads and corrections; retain before/after history and update rankings.
- Automatic promotion suggestions/decisions are deferred. Retain explicit manual
  school decisions and historical records. Future suggestions need an explicitly
  agreed annual results basis and threshold; never silently choose a formula.
- Three terms/year, with Headmaster-configured dates. Historical classes, marks and
  attendance must not be rewritten by a new year's roster.
- Excel and CSV imports; Excel, CSV and printable/PDF reports. Filters must affect
  both displayed values and exports. Ordinary reports exclude private contacts.
- Official source-file layouts, maximum-mark representation, and rounding tolerance
  need synthetic/redacted samples before final parser acceptance. No real student
  data in the current demo.

## Discipline imports and roster

- External school system is the authority for discipline points. No manual website
  form for adding/deducting official points.
- Discipline Officer previews/applies imports directly, without a second reviewer.
  Notify Headmaster and fellow Discipline Officers; identify uploader and changes.
- Keep validation, source evidence and upload history. Notifications replace approval
  waiting, not validation or accountability.
- Roster bulk import: preserve omitted fields, preview changes, no score changes or
  automatic re-invitations, reject invalid batches rather than quietly skipping rows.
- Preserve archived/transferred/graduated history; exclude inactive records from
  current attendance and active rankings.

## Accounts, notices and public content

- Student login is ID + password. Email setup first; SMS deferred pending costs.
- Verified parent/guardian email OR a privately issued school one-time setup code
  can support students without email. Never give everyone a shared default password.
- Discipline Officers can issue temporary reset codes, with a recorded action.
  They must never see a student's password.
- Only Headmaster creates staff accounts, assigns roles and disables access.
  Both Headmaster and Dean assign teachers to classes.
- Headmaster, Dean and Discipline Officers can publish school-wide announcements.
  Teachers post to assigned classes. Student announcements stay in one feed.
- Announcements are in-app only for first handover, not email/SMS delivery.
- School-approved public details/achievements must replace unverified sample claims.

## AI assistant

- Help with Ruhuka, school-approved information and general/learning questions.
- No access to private student records, no data exports or administrative actions.
- Replies should appear progressively with a waiting indicator and usable stop/error
  states. Preserve accessibility and reduced-motion support.
- Current information requires actual current-source retrieval with meaningful
  citations. Do not promise freshness merely by adding a system prompt.
- Current endpoint is EjoLabs JSON response, not a verified streaming/search API.
  Frontend progressive reveal is an interim UI behavior, not live token streaming.
- Production work still needs server-controlled instructions, verified provider
  capabilities, bounded requests/rate limits, approved school knowledge and current
  source retrieval. Never expose privileged credentials in frontend code.

## Reviewable implementation sequence

1. Chat UI and requirements baseline (first change).
2. Attendance calculation/duplicate/correction/absence/overview flows and tests.
3. Roster, scoped one-use grants, staff assignments, notifications and public editors.
4. Academic releases/imports/corrections, reports and promotion review.
5. Mobile/offline/attachment/notebook/announcement QA and accessible first-use help.
6. Reconcile existing Supabase migrations, then implement auth, persistence, storage,
   access controls, notifications and shared updates in tested steps.
7. Verify cross-device workflows, role isolation, imports, recovery, email delivery,
   AI provider/source behavior and school acceptance before functional handover.

No production-ready or fully functional claim until the final verification passes.

## Approved scope update — 3 November

HANDOVER_CHECKLIST.md is the delivery/acceptance tracker and supersedes the initial sequence above. Backend work proceeds alongside frontend work.

Defer parent portal/messaging, SMS, automatic promotion decisions, advanced charts/school-wide leaderboards and elaborate interactive 3D. Retain AI chat and general learning support with live-provider verification. Today dashboard is essential and opens real role-appropriate actions. Remove click sparks/cursor effects, duplicated or placeholder controls and manual discipline point-changing routes. Two lightweight original 3D-looking illustrations are approved for review with static/reduced-motion fallbacks. Named personal notebooks include + New notebook without replacing existing notes. The authorised temporary owner Headmaster account is replaced by a separate school-owned account at handover, preserving audit actors.
