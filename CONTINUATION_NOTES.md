# RUHUKA / Lycée de Kigali — Continuation Handoff

## How to resume

Open this workspace and say: **“Continue from `CONTINUATION_NOTES.md`. First verify the changes already made, then ask me the requirements questions before making further product decisions.”**

Workspace: `c:\Users\Nicole\Downloads\RUHUKA.ui-main(1)\RUHUKA.ui-main`

There is no Git repository here. Preserve the current files; do not use Git rollback assumptions. The local static app was open at `file:///C:/Users/Nicole/Downloads/RUHUKA.ui-main(1)/RUHUKA.ui-main/index.html` during this session. The browser page may need to be shared/opened again after restarting.

## User requirements and boundaries

- Keep the existing static app and design.
- Do not build or modify login/auth; Nicole is handling that separately.
- Do not enter real student data before authentication, shared database storage, and access policies are live.
- Keep official discipline totals controlled by reviewed, verified official imports. make it so that the moment a change or attendance is done the statistics automatically update themselves. make it real time based
- Make imported values safe to render, reload attendance when class/date/period changes, normalize imported attendance statuses, and normalize mixed-scale ranking math.
- Connect the student portal to a future authenticated student identity without implementing authentication now.
- Finish admin review/audit workflows. Connect Supabase only when project configuration is provided. Never put a service-role key in browser code.
- Verify exports/imports, attendance, archive/edit flows, and dark/light school colors in a browser.
- State precisely what is local versus what still needs Supabase/auth/deployment. Do not call the site school-ready until those blockers are resolved.

## Work done in this session (not yet validated)

Changes are saved in the working files:

- `index.html`
  - Removed the editable discipline-total field from student editing; the form now displays a read-only notice.
  - Added reload handlers to attendance date and period controls.
  - Added an attendance CSV import option and description of accepted statuses.
  - Added a local discipline-import review queue and audit-history table to the bulk-import page.
  - Clarified that overall ranks use normalized discipline (/40) and academics (/100), and require both scores.
- `script.js`
  - Roster editing/import no longer writes discipline totals; new students have no assumed official discipline score.
  - Discipline CSV imports are staged locally; approval requires a reviewer note, source reference, and confirmation checkbox. Approval/rejection is recorded in local audit history. This is a demo workflow, **not authenticated verification**.
  - Added attendance import status normalization for present/absent/late/excused and common aliases; class/date/period changes now reload the attendance rows.
  - Normalized discipline to a 100-point scale for mixed rankings, corrected attention thresholds to <20/40 and <60/100, and excluded incomplete records from combined ranking.
  - Escaped imported text in ranking and justification renderers; AI chat output is restricted to a small safe tag allowlist; CSV exports quote fields and neutralize formula-leading strings.
  - Added browser-local audit entries for import review, attendance, discipline reports, student edits/archive, and justifications.
  - Added a future student-portal adapter that accepts a stable `student_id`. It is not wired to authentication; the current demo identity remains.
- `supabase/schema.sql`
  - Added discipline import verification reference requirements and database triggers preventing direct official-total changes without a matching verified event from an approved discipline import batch.
- `SUPABASE_SETUP.md`
  - Clarified local review limitations, future student identity mapping, and Supabase/security boundaries.

Important: the browser-only review queue and audit log can be altered by the browser user. Only authenticated server/database enforcement can make those workflows trustworthy.

## Known status before this session

The user reported that the HTML looked sound in the browser, JavaScript syntax had passed, report export worked, and the browser demo contained 978 students with zero attendance/discipline events. Those counts and prior checks were **not independently rechecked in this session**. The app loaded in the browser, but the code changes above have not yet been checked or exercised.

## First actions on resume

1. Re-read the current `index.html`, `script.js`, `supabase/schema.sql`, and `SUPABASE_SETUP.md`; inspect the active browser page and current local demo counts. Do not assume this note or prior summaries are perfect.
2. Run a JS syntax check (`node --check script.js`) and look for stale DOM references to the removed `studentDiscipline` input.
3. Review the diff manually (there is no Git) and fix any syntax/runtime issues before feature testing.
4. Browser-test current functionality with demo data only:
   - Student roster export and report CSV downloads.
   - Roster, academics, attendance, and discipline import preview; XSS-shaped text; invalid attendance statuses; discipline remains unchanged until review; approve/reject persistence and audit.
   - Attendance class/date/period reload, saved state, draft state, and status normalization.
   - Ranking math/attention reasons with contrasting values such as 20/40 discipline and 60/100 academics, plus missing scores.
   - Student edit, archive, restore; confirm discipline total is not editable through either path.
   - Dark/light theme and existing green/red school visual identity.
5. Inspect SQL trigger/policy consistency. No live Supabase project is available, so do not claim database behavior is tested; use a PostgreSQL/Supabase staging project only after configuration and authorization are provided.
6. Ask Nicole the outstanding requirements questions below before choosing behavior that is not already explicitly specified.

## Requirements questionnaire

Answer whatever you can; “use your recommendation” is fine for any question. Authentication itself remains Nicole’s separate task.

## Decisions confirmed with Nicole (2026-10-17)

- **Portals and roles:** Keep exactly four portals: Student, Staff, Admin, Parent. Staff portal contains multiple staff roles; do not split roles into additional portals. Teachers, Discipline Officers, and Deans use Staff portal; Headmaster/designated school administrators use Admin portal. Detailed permissions still need clarification.
- **Student accounts:** A roster import creates pending invitation records, but does not send automatically. Admin explicitly selects email or SMS per student and a verified recipient (student or guardian). Add separate student email/phone and invitation-channel fields. A student enters student ID plus a one-time code; code is single-use, expires after 24 hours, and resend invalidates the old code. Re-import does not resend. Missing contact or delivery failure remains in an admin follow-up queue. Student sets their own password after successfully claiming the roster record; never use shared/admin-set passwords. Bulk invitation confirmation is wanted, but exact behavior is undecided.
- **Student-supplied details:** Roster requires only student ID, name, and class. Optional details can be added by the student at signup and should appear in the admin record. Students can provide their own contact and guardian details; these show as unverified immediately and must be verified before use for invitations. School-controlled fields (class, status, scores) remain staff/import-controlled.
- **Roster imports:** Support CSV and Excel from the start. Match existing records by exact student ID, show changes for review, preserve omitted fields, and never change discipline totals or resend invitations via roster import. All-or-nothing: no rows are applied until the file is valid and approved. Inactive students retain records/history and are excluded from active attendance, rankings, and invitations. Keep academic/attendance scores out of roster imports; use separate imports. Who can approve roster batches remains undecided.
- **Manual roster edits:** Nicole wants all manual roster edits saved immediately, with an audit record. This is separate from bulk roster import, which remains all-or-nothing/reviewed.
- **Discipline:** Official source requirements and who uploads/reviews the files will be decided later. Separate uploader/reviewer and no self-approval. Retain the source file and audit metadata. Event-only rows may be retained; only verified snapshots change the current total. Conflicting snapshots on the same date are blocked for admin resolution. Keep rejected batches; corrections use new batches.
- **Attendance:** Canonical statuses are present, absent, late, excused; normalize common equivalents. Late counts as present in the rate but remains separately reportable. Excused is excluded from rate denominator and unexcused absence totals, but tracked separately. Date format is DD/MM/YYYY. Duplicate attendance imports require correction review with before/after. Bulk attendance review policy is undecided; Nicole did not adopt the recommendation to review every attendance import. Full-day absence counting rule is undecided; Nicole said “count only full absent days” but selected “another rule / decide later” when asked to confirm the precise meaning.
- **Attendance corrections:** Staff may correct submitted attendance; stats should update immediately and the audit trail should keep old and new values.
- **Real-time updates:** Nicole wants changes to sync immediately to other authorized users/devices, not only the same browser. Local-only mode cannot provide cross-device sync; implement that only after authenticated shared storage/RLS is ready.
- **Rankings and attention:** Ranking formula is undecided. Student attention threshold confirmed: discipline below 20/40 or academics below 50/100. Class-level attention confirmed: discipline average below 20/40 or academic average below 60/100. Ties share rank (competition style such as 1, 2, 2, 4).
- **General review:** Review roster changes and all bulk/corrective imports; absence justifications go to staff review. Attendance import review policy remains undecided. Academic imports are the exception: the Dean previews and applies the import directly, and this Dean review satisfies the review step; no Admin approval is needed.
- **Staff role clarification:** Every staff member should be able to take attendance. Teachers normally take attendance for their own assigned teaching periods, and Nicole decided teachers may also take attendance outside their lessons directly, without an approval step, to save time. Teachers may search for and view a student's full academic results and official discipline history, read-only; hide guardian/student contacts and account/invitation details. Do not confuse teacher read access with Discipline Officer permissions; other staff roles' detailed permissions remain to be clarified.
- **Staff permissions:** Teachers/staff use the Staff portal; Admin portal is for Headmaster/designated school admins. Staff role permissions beyond the teacher decisions above remain to be clarified. Who uploads/reviews discipline batches is undecided; do not assume it is Discipline Officer + Headmaster/Admin.
- **Parent portal:** How parent accounts are securely linked to one or more student records is undecided; do not implement parent-to-student linking by assumption.
- **Parent portal content:** After a secure approved link exists, Nicole chose read-only academic results, attendance, official discipline history, announcements, and reviewed absence-justification status; parents cannot change school records or see other students.
- **Audit retention/access:** Keep audit history indefinitely, subject to school policy. Only authorized Admin portal roles can view/export it, and audit exports themselves must be logged.
- **Report formats/privacy:** Provide CSV, Excel, and print/PDF summaries. Include selected date filters and generated time. Exclude student/guardian contact details from normal reports; allow them only in a separate authorized contact export and log that export.

### Roster administration and imports

1. **What file format should staff use for roster imports?**  
   Nicole chose CSV and Excel from the start; provide a downloadable template.
2. **Which columns are mandatory to create a student row, and what may the student add later?**  
   Nicole chose student ID, name, and class as required. Student email/phone and guardian details can be added during signup; show them to admins immediately as unverified and require verification before invitation use. Class, status, and scores remain school-controlled.
3. **What must happen when an imported ID already exists?**  
   Nicole chose exact ID match, before/after review, preserve omitted values, never change discipline totals, and never resend invitations from roster import.
4. **Should imports be allowed to change a student ID, or should IDs be immutable?**  
   Suggested: immutable; correct mistakes through a separately reviewed administrative workflow.
5. **What does an omitted field mean in an update: preserve the old value, or clear it?**  
   Nicole chose preserve existing values.
6. **How should imported records with `Archived`, `Transferred`, or `Graduated` status behave?**  
   Nicole chose retain records/history; exclude from current attendance, rankings, and invitations.
7. **Should a whole roster import be all-or-nothing, or may valid rows apply while invalid rows are skipped?**  
   Nicole chose all-or-nothing; correct errors before applying any rows.
8. **Should roster imports ever include academic or discipline totals?**  
   Nicole chose to keep scores out of roster files; use separate imports.

### Student accounts and portal identity (requirements only; do not implement auth here)

9. **Who will create student accounts, and in which system?**  
   Nicole agreed to pending invitations from roster imports, claimed later by the student through the separate secure authentication system.
10. **When should an account be linked to a roster row: during account creation, or by a later admin matching step?**  
    Suggested: use the unique, reviewed student ID to link `auth_user_id`; surface unmatched/duplicate links as errors requiring manual resolution. Nicole chose student ID plus one-time code at claim time.
11. **How should students receive claim codes, and what should happen on failures?**  
    Nicole wants admin to choose email or SMS per student and choose verified student or guardian contact; add student contact fields. Code is single-use, expires after 24 hours, resend invalidates prior code. Routine roster re-import never resends. Missing contact or delivery failure remains in an admin follow-up queue. A bulk confirmation action is desired, but its exact eligibility/behavior is undecided.
12. **Should portal identity be resolved from the signed-in Auth user's `auth_user_id` relation, rather than trusting a student ID submitted by the browser?**  
    Suggested: yes; query the signed-in user's linked `students` row under tested RLS. Auth remains Nicole's separate work.

### Official discipline source and approval

13. **Which source documents/data are officially acceptable for discipline totals?**  
    Suggested: name the issuing system/document and require a reference number plus a retained source file in protected storage.
14. **Who may upload a discipline file, and who may approve it? Can the uploader approve their own batch?**  
    Suggested: authorized discipline staff upload; a separate authorized reviewer approves (four-eyes control; uploader cannot self-approve).
15. **Is the review note plus source reference enough, or must the original source file be attached and retained?**  
    Suggested: attach and retain the original with checksum, uploader, reviewer, timestamps, and outcome.
16. **If an import contains only event/change values and no official total, should approval append an event, or should all discipline files be rejected unless they contain a snapshot total?**  
    Suggested: allow append-only reported events, but only a verified total snapshot can change the current official total.
17. **If two verified snapshots have the same date, how should conflict resolution work?**  
    Suggested: reject the conflict pending reviewer resolution; never choose based on CSV row order.
18. **Should a rejected batch remain visible in history, and should a corrected upload create a new batch?**  
    Suggested: retain rejected batches immutably and make corrections new batches linked to the prior batch.

### Attendance behavior

19. **Are the four statuses present, absent, late, and excused the complete official status set?**  
    Suggested: yes; map common values such as `P`, `A`, `tardy`, and `justified` to canonical values and reject unknown statuses.
20. **Does `late` count as present for attendance rate?**  
    Suggested: yes, but expose lateness as its own count in reports.
21. **Does an excused absence count in the attendance-rate denominator or absence total?**  
    Suggested: exclude excused from attendance-rate denominator and keep it separately counted, not in unexcused absences.
22. **Can there be multiple attendance periods per day, and how should they contribute to an absence count?**  
    Suggested: one period/session is one mark; calculate rates from sessions, but report both session absences and unique absent days.
23. **When an imported row collides with an existing class/date/period/student session, should it overwrite, reject, or require a reviewed correction?**  
    Suggested: do not silently overwrite submitted/approved sessions; stage a correction for review with before/after audit.
24. **What date/timezone and date formats will source files use?**  
    Suggested: require ISO `YYYY-MM-DD` in school-local time; show invalid dates during preview.
25. **Should attendance imports be reviewed before applying, like discipline imports?**  
    Suggested: yes for bulk changes, with uploader/reviewer separation; teachers can continue entering individual sessions under their authorized role after auth exists.

### Ranking and attention policies

26. **Should the combined ranking be a 50/50 average after converting discipline /40 and academics /100 to percentages?**  
    Suggested: yes, and exclude students missing either metric from the combined ranking. Nicole: undecided.
27. **Are attention thresholds exactly discipline below 20/40 or academics below 50/100?**  
    Suggested: yes; display both reasons when both thresholds are missed. Nicole confirmed these student thresholds.
28. **Are class-level thresholds discipline average below 20/40 or academic average below 50/100?**  
    Suggested: match student thresholds. Nicole: undecided.
29. **Should ties share the same rank, or use sequential positions?**  
    Suggested: competition ranking (1, 2, 2, 4) with the score and tie policy visible. Nicole confirmed shared ranks.

### Admin reviews, audit, reports, and deployment

30. **Which workflows require explicit admin review: discipline imports, roster edits, attendance corrections/imports, absence justifications, academic imports, or all of them?**  
    Suggested: review high-impact bulk/import changes and corrections; define role permissions for each before coding.
31. **Which admin roles and permitted actions should exist?**  
    Suggested: derive a written matrix for headmaster/admin, discipline officer, dean, teacher, student, and parent; enforce it with server-side RLS, not UI visibility.
32. **How long should audit history be retained, and who may view/export it?**  
    Suggested: keep indefinitely, allow only authorized Admin roles to view/export, and log exports. Nicole confirmed this.
33. **Which report exports are required, and which fields should be excluded?**  
    Nicole wants CSV, Excel, and print/PDF; include selected date filters and generated time. Exclude student/guardian contact details from normal reports; provide them only through a separate authorized contact export and log that export.
34. **What project URL, public anon key, staging project, hosting provider, and deployment process will be supplied for Supabase integration?**  
    Suggested: provide staging first; browser gets only the public anon key after RLS tests. Never provide a service-role key to frontend code.
35. **Who owns final auth integration and who will test RLS with each role?**  
    Suggested: coordinate with Nicole’s auth owner; do not connect production student data until role-based tests pass.
36. **Which screen sizes/browsers are the required visual support targets?**  
    Suggested: current supported desktop/mobile widths in Chromium first, then confirm target school devices.

## Suggested implementation order after answers

1. Validate and repair the saved local-demo changes; finish browser checks using synthetic/demo data only.
2. Confirm workflow requirements, CSV templates, and role/action matrix with Nicole.
3. Build/test migrations and policies in a staging Supabase project; prove the discipline trigger and RLS with separate role accounts.
4. Have the auth owner deliver the authenticated identity contract; wire the stable student record mapping only after that contract is available.
5. Connect app persistence to Supabase using only project URL + anon key and RLS-protected requests; keep privileged operations server-side.
6. Validate end-to-end import review, audit, reports, attendance, archive/edit, and both themes on staging.
7. Only consider deployment for real school use after auth, shared storage, policies, backup/recovery, and deployment checks are complete.
