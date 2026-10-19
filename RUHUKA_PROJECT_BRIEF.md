# RUHUKA / Lycée de Kigali — Project Brief

This is the short, portable description of what RUHUKA is intended to become, the decisions Nicole has made so far, and what remains before launch. It is written for Nicole, a future developer, or another AI continuing the work.

## What RUHUKA is

RUHUKA is the Lycée de Kigali school website and, eventually, a secure school information portal. The current project is a static website with the school's existing visual identity and a local demonstration of school workflows. The completed product is intended to support students, staff, administrators, and parents through exactly four portals:

- **Student:** the student's own results and school information, tied to their authenticated student record.
- **Staff:** one portal shared by staff members with different roles, including teachers, Deans, and Discipline Officers.
- **Admin:** for the Headmaster and designated school administrators.
- **Parent:** read-only information for the child or children securely linked to that parent.

The eventual system should manage student rosters and invitations, academic results, attendance, official discipline history, absence justifications, announcements, imports, reviews, audit history, and privacy-conscious reports. Authorized users should see shared updates across devices once authenticated shared storage is available.

## Confirmed decisions — question and answer record

The entries below summarize the 36 product questions recorded in `CONTINUATION_NOTES.md`. “Undecided” means Nicole has not selected a behavior; a suggestion is not treated as approval.

### Roster and student accounts

| # | Question | Nicole's answer / current status |
|---|---|---|
| 1 | What file formats should roster imports support? | CSV and Excel from the start; provide a downloadable template. |
| 2 | What is required to create a student, and what can they add later? | Student ID, name, and class are required. Student/guardian contact details may be added later, are unverified initially, and must be verified before invitation use. Class, status, and scores are school-controlled. |
| 3 | How should an existing student ID in an import be handled? | Match exact ID, preview changes, preserve omitted fields, do not change discipline totals, and do not resend invitations. |
| 4 | Can student IDs be changed? | **Undecided.** The suggested approach was immutable IDs with a separately reviewed correction process. |
| 5 | What does an omitted import field mean? | Preserve its existing value; do not clear it. |
| 6 | What happens to archived/transferred/graduated records? | Retain records and history, but exclude inactive students from current attendance, rankings, and invitations. |
| 7 | Can valid rows apply when other import rows are invalid? | No. Roster imports are all-or-nothing; fix errors before applying any rows. |
| 8 | Can roster files contain academic or discipline scores? | No. Keep scores out of roster files and use separate imports. |
| 9 | How are student accounts created? | Roster imports create pending invitations, not Auth accounts. Students claim them through the separate secure authentication system. |
| 10 | How is a student account linked to a roster record? | Student ID plus a one-time claim code at claim time. The intended future identity is the authenticated student linked to their stable student record; auth implementation is separate. |
| 11 | How are claim codes delivered and failures handled? | Admin chooses email or SMS and a verified student or guardian contact per student. Codes are single-use and expire after 24 hours; resending invalidates the old code. Routine roster imports do not resend. Missing contacts/delivery failures go to admin follow-up. A bulk-send confirmation is desired, but its exact behavior is undecided. |
| 12 | Should the browser be trusted to identify the student by a typed ID? | No: the intended future portal should resolve the student from the authenticated identity and linked student record. This is a future requirement, not current auth functionality. |

### Discipline and attendance

| # | Question | Nicole's answer / current status |
|---|---|---|
| 13 | Which source documents are official for discipline totals? | **Undecided.** Suggested: require an identified issuing source, reference, and retained original file. |
| 14 | Who uploads and approves discipline imports; can the uploader approve? | Separate uploader and reviewer; no self-approval. The exact authorized roles are **undecided**. |
| 15 | Is a note/reference enough, or must the original discipline file be kept? | Keep the source file and audit metadata. Exact retention/storage details remain to be designed. |
| 16 | Can discipline imports contain events without a total snapshot? | Event-only rows may be retained, but only a verified official snapshot changes the current official total. |
| 17 | What if two verified snapshots conflict on the same date? | Block the conflict for admin resolution. |
| 18 | What happens to rejected discipline batches? | Keep rejected batches in history; corrections are new batches. |
| 19 | What attendance statuses are official? | Present, absent, late, and excused; normalize common equivalent values. Unknown values should not be silently accepted. |
| 20 | Does late count as present? | Yes for the attendance rate; report lateness separately. |
| 21 | How does excused absence affect rates and absence totals? | Exclude it from the rate denominator and unexcused absence total, but track it separately. |
| 22 | How do periods contribute to absence totals, and what is a full-day absence? | The precise full-day rule remains **undecided**. Nicole said to count only full absent days, then deferred the exact rule. Do not infer a rule from multiple periods. |
| 23 | What if an attendance import collides with an existing session? | Require a correction workflow with before/after audit; never silently overwrite. |
| 24 | What date format should attendance use? | DD/MM/YYYY. |
| 25 | Must every bulk attendance import be reviewed before applying? | **Undecided.** Nicole did not adopt the suggested rule to review every attendance import. |

### Rankings, review, roles, reporting, and deployment

| # | Question | Nicole's answer / current status |
|---|---|---|
| 26 | What is the combined ranking formula? | **Undecided.** A normalized 50/50 average of discipline /40 and academics /100 was suggested, but not confirmed. |
| 27 | What triggers individual student attention? | Confirmed: discipline below 20/40 or academics below 50/100. |
| 28 | What triggers class-level attention? | Confirmed: discipline average below 20/40 or academic average below 60/100. |
| 29 | How should ties rank? | Shared/competition ranking, e.g. 1, 2, 2, 4. |
| 30 | Which actions require review? | Review roster changes and bulk/corrective imports. Absence justifications go to staff review. A Dean may preview and apply academic imports directly; that Dean review is sufficient and no Admin approval is needed. Attendance-import review remains undecided. |
| 31 | Which roles may perform which actions? | Exactly four portals; Staff has multiple roles. Teachers may take attendance, including outside their assigned lessons, and may read academic results and official discipline history. Teachers cannot edit those histories and must not see contact or invitation details. The detailed permission matrix and other staff-role permissions remain **undecided**. |
| 32 | How long is audit history kept, and who can export it? | Keep indefinitely, subject to school policy. Only authorized Admin roles may view/export it; audit exports must themselves be logged. |
| 33 | Which report formats and privacy rules apply? | CSV, Excel, and print/PDF summaries, with selected date filters and generated time. Ordinary reports exclude student/guardian contacts. A separate authorized contact export must be logged. |
| 34 | What configuration and deployment setup is available for Supabase? | No live project configuration is available yet. Use staging first; only a public anon key may be used in the browser after RLS testing. Never put a service-role key in browser code. |
| 35 | Who owns auth integration and role-policy testing? | Auth is being handled separately by Nicole. Exact integration handoff and per-role RLS test ownership still need coordination. |
| 36 | Which browsers and screen sizes must be supported? | **Undecided.** Chromium desktop/mobile was suggested as a starting point, not confirmed as the support target. |

### Additional decisions captured during clarification

- Keep **exactly four portals**; staff roles do not become separate portals.
- Manual roster edits should save immediately and leave an audit record. This does not change the all-or-nothing review rule for bulk roster imports.
- Staff may correct submitted attendance; related statistics should update immediately, with old and new values kept in the audit trail.
- Authorized users should eventually receive immediate cross-device updates. Local browser storage cannot provide this.
- Parents should have read-only access to linked children's academic results, attendance, official discipline history, announcements, and reviewed absence-justification status. Parent-to-child account linking is **undecided** and must be secure; parents must not see other students.
- Real student data must not be used until authentication, shared storage, access policies, and deployment safeguards are in place.

## Where the project is now

- The app remains a static local demo in `index.html`, `script.js`, and `style.css`; its existing design should be preserved.
- Current demo/workflow state is browser-local. It is not shared across staff or devices, and local review/audit data can be changed by the browser user.
- `supabase/schema.sql` is a database blueprint, not a verified live deployment. There is no provided project URL/anon key and no tested live RLS setup.
- `SUPABASE_SETUP.md` documents the boundary between local demo behavior and future authenticated Supabase use.
- The continuation notes report saved work for discipline import review, attendance normalization/reload, ranking adjustments, safe rendering/export handling, local audit entries, and a future student identity adapter. Those changes were **not browser-validated** in the last recorded work.
- In this documentation pass, the current `script.js` passed `node --check`. No browser page was shared, so the workflows and visual themes have not been rechecked here.
- A previous report of 978 demo students, zero attendance/discipline events, and a working report export came from the user and has not been independently reconfirmed.
- There is no Git repository; preserve the current files and do not assume Git rollback is available.

## What remains before RUHUKA can be complete

1. **Finish local-demo verification and repairs** using synthetic/demo data only: roster and report exports; roster, academic, attendance, and discipline imports; malicious-looking CSV text; discipline review and audit; attendance reload/status handling; ranking and attention boundaries; edit/archive/restore; and dark/light school colors.
2. **Resolve the remaining product decisions**: roster ID corrections and batch approvers; official discipline sources and authorized uploader/reviewer roles; full-day absence definition; attendance-import review; ranking formula and missing-score treatment; parent-child linking; detailed role/action matrix; bulk invitation behavior; auth/RLS handoff; and supported browsers/devices.
3. **Complete security and data architecture** with an authenticated identity contract, shared database, tested Row Level Security for each role, protected source-file storage, audit controls, backup/recovery, and trusted server-side operations for privileged actions.
4. **Connect the app only after project configuration is provided.** Use the browser-safe public anon key only with tested RLS. Keep service-role credentials server-side. Do not use real student data during the local-demo phase.
5. **Run staging end-to-end tests and deployment checks** for imports/reviews, attendance corrections, parent/student data boundaries, audit/export, archive/edit, both themes, and cross-device updates.
6. Call the system school-ready only after authentication, shared storage, policies, operational safeguards, and deployment have been verified.

## Suggested next steps

1. Continue the outstanding questions one at a time; Nicole can accept the recommendations or decide later.
2. Then resume the local-demo validation listed above before attempting any Supabase connection.
3. Bring in the auth owner and staging project only when their configuration and role contract are ready.

To resume, open this workspace and say: **“Continue from `RUHUKA_PROJECT_BRIEF.md`. Read the current files, ask the remaining requirements questions one at a time, and do not implement auth or use real student data.”**

For implementation task details and the original question wording, see [CONTINUATION_NOTES.md](./CONTINUATION_NOTES.md). For the Supabase boundary, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
