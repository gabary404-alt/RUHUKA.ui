# RUHUKA — Master Project Handoff

Last reviewed: 2026-10-31 (Africa/Kigali)
Repository: https://github.com/gabary404-alt/RUHUKA.ui
Live-site target: https://ruhukaui.vercel.app/
Current reviewed main commit: ec2c5695f5d7c56d51dde1f248d08a4645d64703 — “Separate rankings, lock discipline edits, and finish demo portal flows”

## Purpose of this document

This is the main orientation and product handoff for anyone continuing RUHUKA: a developer, designer, school representative, or another AI assistant. It describes the intended school system, current progress, decisions confirmed by the project owner, boundaries that must not be broken, known gaps, unresolved questions, and a practical picture of the finished product.

Use this as the current working brief. Older files such as RUHUKA_PROJECT_BRIEF.md, CONTINUATION_NOTES.md, and SUPABASE_SETUP.md contain useful history but include decisions and progress statements that are now stale or conflict with newer direction. When there is a conflict, use this order:

1. The project owner’s latest direct instructions in the active project conversation.
2. This handoff, updated to reflect those instructions.
3. Older project notes and code comments.

Do not treat an older suggestion as an approved requirement merely because it appears in an older document.

## 1. What RUHUKA is

RUHUKA is the public website and school information portal being prepared for Lycée de Kigali in Kigali, Rwanda. Its purpose is to reduce paperwork and repeated trips to school offices, give students and parents understandable access to relevant school information, and make routine school work faster and more consistent for teachers and administrators.

RUHUKA is not intended to replace the school’s external discipline-scoring system. It is not a combined academic-and-discipline scoring system. It is not a way for teachers to alter official discipline totals. The school already controls those scores elsewhere. RUHUKA receives official discipline imports and presents the relevant records to students and authorized staff.

The intended product has a public school website plus exactly four portals:

- Student portal
- Staff portal, used by teachers and authorized staff roles
- Admin portal, for the Headmaster and designated administrators
- Parent portal

A portal is a role-focused view of school information and tasks. Frontend visibility alone is never security; the future backend must enforce the same access decisions.

## 2. Who RUHUKA is for

### Students

Students should be able to see their own school records without needing to visit an office for routine updates. Depending on the record, this includes academic results, academic and discipline positions, main attendance, follow-up lesson attendance, official discipline totals and dated history, announcements, notifications, and the status of an absence explanation they submitted.

A student must only see their own private record.

### Parents and guardians

A parent should be able to see the child or children linked to their account, including academic results, attendance, official discipline history, announcements, and reviewed absence-justification status. Parents cannot edit school-controlled records or see unrelated students. Parents should be able to message the school and see the school’s replies.

### Teachers

Teachers should have a low-friction workflow for the classes assigned to them. They can take attendance for those assigned classes and use optional follow-up lesson attendance to report who did not study during a period. Teachers must not get access to other teachers’ classes or school-wide attendance through the teacher view.

Teachers do not add or deduct discipline points on RUHUKA. The official discipline record is not a teacher-operated feature.

### Discipline Officers

Authorized discipline staff need school-wide attendance visibility, attendance and midday-return review, absence-justification review, official discipline imports and history, the relevant Needs Attention queues, and a school inbox for parent messages. They must not manually edit official discipline totals on RUHUKA.

### Dean of Studies

The Dean of Studies needs academic imports and records, student/class academic rankings, and academic reports. Academic work should not be mixed into discipline scoring.

### Headmaster and designated administrators

They need school-level oversight, authorized staff and class assignment management, imports, statistics, reports, rankings, Needs Attention review, audit history, school notices, and appropriate administration settings.

## 3. Confirmed product rules

These are the current direction from the project owner.

### Official discipline data

- The school’s existing external system remains the authority for adding or deducting discipline marks.
- RUHUKA receives official totals and history through bulk imports.
- The intended import includes student ID/name, class, gender, official total, number and dates of changes, points added or removed, the reason, and who recorded the official action or its source.
- Students should be able to understand their current official total and why it changed, including the reason and date.
- No one uses RUHUKA to manually add or deduct official discipline points. Remove or avoid every such form, button, shortcut, and misleading label.
- Teachers do not edit official discipline data. The website’s purpose is to display imported official records to the relevant student and authorized school roles.
- Authorized Headmaster/discipline staff handle the import workflow. The exact source-file format and required official source evidence should be confirmed against a redacted or synthetic school sample before finalizing a parser.

### Attendance

There is one official main attendance each school day. It affects attendance statistics.

A teacher may also take a follow-up attendance for a particular lesson or period. It answers a different question—who did or did not study that period and why—and is useful for reporting and follow-up. It must remain separate from the main attendance and must not affect official daily attendance rates or main-attendance absence counts.

Teachers are assigned to classes and only work with their assigned classes in the teacher portal. Authorized administrators and discipline staff can review school-wide attendance.

A student who returns during the day after the main attendance has been taken may be recorded by an authorized discipline staff member as present for that day, with an excused midday-return explanation visible alongside the present status. The correction must not erase the history of what changed.

Attendance changes should identify the person who submitted or corrected the record and the relevant date/time. The school should be able to review who took an attendance.

### Needs Attention

A student enters Needs Attention when any one of these conditions applies:

1. Academic result is below 50%.
2. Official discipline total is below 20 out of 40.
3. Main-attendance absences are more than five days.

The portal should present three understandable categories and show which condition caused each flag. Only an Admin or Discipline Officer may review and clear a category. A review must record who reviewed it, when, and the decision. Clearing one category should not silently clear other qualifying categories for the same student.

The exact absence-counting window, and whether a cleared flag should be raised again when the same condition remains true in the same reporting period, still need a product decision. Do not invent that rule. Preserve the review history either way.

### Rankings

- Academic and discipline rankings stay separate.
- Each domain ranks students and classes.
- There is no combined ranking of academic results and discipline.
- Tied scores share a position and the next position is skipped: 1st, 2nd, 2nd, 4th.
- Missing scores must be clearly treated as missing, not silently converted to zero.
- The exact academic calculation, the class-average calculation, the treatment of missing subject results, and the ranking period should be confirmed before production reporting.

### Parent-school communication

- A parent can start a message to the school.
- The school must have a school-side inbox to receive it, and the Discipline Officer must be able to see and respond to parent messages.
- The parent can see the conversation and the school’s response.
- The interface should show simple states such as awaiting response and answered.
- Messages are not considered delivered until the actual shared backend flow exists. A same-browser demo conversation is only a prototype.

### Student and family account setup

Student roster imports are expected to provide or be associated with verified email addresses or phone numbers so students can receive a code to claim and secure their accounts. Students should not be issued a common default password. Account creation, code delivery, identity verification, password setup, and account security are backend/authentication work and must not be represented as already working in the frontend.

Parent-to-child links must be secure; a parent must never be able to select an unrelated student. The secure linking design belongs in the backend phase.

### Simplicity and school operations

- Prefer short, clear workflows that school staff can learn without constant developer help.
- The system should reduce paperwork and duplicate entry, not add a second process for staff to maintain.
- Keep different kinds of attendance and different ranking domains visibly separate.
- Provide enough explanation for parents and students to understand records without sending them to an office for every routine question.
- Do not automate a consequential discipline decision. The school’s authorized staff review concerns and take action.
- Do not use real student records in a demo or staging setup until authentication, access policies, and deployment safeguards are verified.

## 4. Where the project is now

### GitHub and frontend

The repository is gabary404-alt/RUHUKA.ui. The current main commit reviewed for this document is ec2c5695f5d7c56d51dde1f248d08a4645d64703, dated 2026-10-31 in GitHub. It added a demo portal-flow file and updated index.html and script.js.

The application is a static single-page frontend, primarily:

- index.html — public page and portal screen structure
- style.css — visual design and layout
- script.js — demo records, navigation, display, imports, ranking and report logic
- portal-flows.js — newer demo-only portal interactions
- supabase/schema.sql and the supabase directory — checked-in database-related source
- RUHUKA_PROJECT_BRIEF.md, CONTINUATION_NOTES.md, and SUPABASE_SETUP.md — older project documentation

The public landing page is polished and the portal interface covers many major areas. The latest main commit added or improved demo UI for separate ranking displays, Needs Attention flags and clearing, student results and attendance views, a timetable preview, attendance type labels, midday returns, a parent-child selector, a parent inbox screen, and demo replies. It also removed discipline-point entry controls from the teacher-facing area.

These are frontend prototypes. In particular, the current parent inbox and replies are stored in browser-local data and are not delivered to another staff member. Current role selection and role previews do not provide real security. A demo account or fake data is not an authenticated school account.

Important frontend items still needing review or completion include:
- Admin roster users screen does not yet present a complete staff directory and teacher-to-class assignment workflow.
- Needs Attention is currently a demo interaction; confirm that three categories, clearing history, role-specific controls, and the owner’s exact re-flag rule are clearly represented.
- The report UI has range/domain/class controls, but the date range must actually affect the displayed calculations; inspect and verify this rather than assuming the controls work.
- Parent messaging is only a same-browser demo. The inbox/reply interaction needs a clear demo disclaimer and should be checked end-to-end in the visible UI.
- Demo teacher class assignment is fixed to a sample class. Production assignments will come from the real school roster and role setup.
- Review remaining sample names, scores, dates, badges, notifications, and public claims before presenting the site as real school data.
- Check the latest code and live Vercel deployment together; a GitHub main commit does not prove Vercel has deployed it.

The user has separately asked to use Grok Build to make additional frontend changes. Confirm which version has been merged to the GitHub repository before treating Grok’s work as part of main.

### Supabase/backend

A Supabase project for RUHUKA has already been created and has a partially built schema. It is not yet integrated into the frontend. Read-only inspection on 2026-10-31 found:

- 13 migrations recorded as applied, through 20261027180652_allow_class_wide_teacher_assignments.
- 16 public tables existed with Row Level Security enabled: school_classes, students, import_batches, academic_records, attendance_sessions, attendance_records, discipline_events, workflow_items, audit_events, profiles, user_roles, teacher_class_assignments, parent_student_links, student_private_contacts, discipline_import_snapshots, and discipline_import_rows.
- The application tables had no school records. There was one Supabase Auth account, but no matching profile or user_roles row. Do not include or infer the identity of that account.
- A main_attendance_stats view existed and was intended to exclude follow-up attendance from the main attendance result.
- Attendance schema already distinguished main and period_followup attendance, and contained fields for a submitted-by user and midday-return details.
- Realtime publication included a set of application tables, but the frontend did not subscribe to Supabase; publication membership alone does not make the app realtime.
- A discipline import application function existed. The frontend and database import workflow still need to be reconciled with the current user-approved process.
- There were no Supabase Storage buckets or Edge Functions at inspection time.
- The live schema and the repository’s migration history had drift. Two migration files were found on a backend feature branch but not on main; a later applied migration was missing from both checked source locations. The older main-branch schema/setup documentation also described role handling differently from the live database.
- The Auth leaked-password protection advisory was disabled at inspection time. Security and performance advisors also showed items to investigate. Recheck current advisories before relying on these observations.

These are time-bounded observations, not a declaration that Supabase is ready. Reinspect project state, migration files, policies, and advisories before any schema change. Never place a service-role key in browser code. Real student data should wait until authentication and per-role access have been tested.

## 5. Intended final product

When RUHUKA is ready for school handover, the school should be able to operate it without needing the original developer for ordinary work.

### Teacher’s day

1. The teacher signs in using the school-approved account flow.
2. The teacher sees their assigned classes and selects the day’s main attendance.
3. They mark the class quickly, review the list, save progress, and submit.
4. If needed, they take a clearly separate follow-up lesson attendance and record who did not study and why.
5. They can later see the submissions they made and whether they were corrected or reviewed.

### Discipline Office’s day

1. The Discipline Officer sees school-wide main attendance and exceptions.
2. They review submissions and record authorized midday returns without losing the student’s present status.
3. They review absence explanations and take action.
4. They import official discipline data from the school’s external process using a clear preview and error report.
5. Students see their own updated official totals and the dated reasons for changes.
6. They review and clear eligible Needs Attention categories.
7. They receive parent messages, respond, and keep the conversation visible to that parent.

### Dean of Studies’ day

1. The Dean imports or reviews academic results using an agreed template.
2. They see missing, invalid, and duplicate records before applying results.
3. They review class and student academic performance for the selected academic period.
4. Academic rankings use the approved score and tie rules and are presented without discipline data mixed in.

### Headmaster’s day

1. The Headmaster sees school-level status and clear exceptions.
2. They maintain the roster and authorized staff/class assignments.
3. They review imports, reports, and audit history as allowed by role.
4. They can see whether work is complete and where staff follow-up is needed without asking every department to reprint spreadsheets.

### Student’s experience

A student signs in, sees only their own correct record, understands academic and discipline positions separately, can read the official discipline history and attendance, and can submit an absence explanation. The student is not required to visit an office just to see a routine updated record.

### Parent’s experience

A parent signs in, chooses only their linked child or children, sees understandable school updates and reviewed records, sends a message to the school, and can follow the conversation until staff respond.

### School reporting

Authorized school users can see weekly/monthly and selected-period reports by class and domain: attendance, academic results, and discipline. The report should show values, trends, the data period and the time it was generated. Main attendance and follow-up lesson attendance remain separate. Missing data is called out. Standard reports should not reveal contact details.

## 6. Suggested additions for the mature product

These are recommendations, not commitments. Adopt them only if the school finds them useful and staff workload remains low.

- **Import exception workspace:** A single screen for unresolved student IDs, duplicate rows, missing fields, and failed account invitations, with plain-language next steps.
- **Attendance completion overview:** A class list showing which assigned teachers have submitted main attendance and which classes still need attention. Avoid punitive rankings of teachers.
- **Historical school-year view:** Preserve previous class and term records so reports and rankings never accidentally mix different academic years.
- **Printable summaries:** Generate clean PDF/print summaries for approved school reports, with the chosen date period and generated time.
- **Data-quality indicators:** Show where recent reports have incomplete imports or missing scores so administrators know how much to trust a comparison.
- **Low-bandwidth friendly screens:** Keep common attendance actions light and usable on basic phones and weak connections. A later offline queue can preserve drafts and show clearly which changes have not synced yet.
- **Language support:** Consider Kinyarwanda and English, with French if the school wants it. Confirm translation ownership before adding language options.
- **Help text and staff onboarding:** Short instructions beside first-use tasks and a downloadable one-page staff guide are more useful than a large, complex training portal.

## 7. Things not to break

- Never add a combined academic-plus-discipline score or ranking.
- Never build a website form that changes official discipline points.
- Never let follow-up lesson attendance change the main attendance rate or main absence thresholds.
- Never silently overwrite submitted attendance or hide its correction history.
- Never make a teacher-facing workflow expose classes outside the teacher’s assignment.
- Never show one family another student’s private record or allow a parent to self-link an arbitrary child.
- Never label browser-local demo data as shared, delivered, verified, or secure.
- Never use real student data in an unprotected demo.
- Never treat an empty or missing score as zero.
- Never put privileged server credentials in frontend code.
- Never use interface hiding as a substitute for backend permission checks.
- Never add complex staff steps without confirming that they solve a real school problem.

## 8. Decisions that still need the project owner

These points are intentionally open. Ask the owner when work reaches the relevant feature instead of guessing.

1. For the more-than-five-absence flag, which period is counted: term, month, academic year, or another window? What exactly is one full-day absence when attendance contains sessions?
2. If a Needs Attention category is reviewed and cleared while the underlying number still qualifies, when can that same category appear again?
3. What official discipline export does the school use? Obtain a synthetic or fully redacted sample and confirm column meanings, date formats, totals, and event rows.
4. Which roles may stage and apply discipline imports? The owner has named the Headmaster or another authorized discipline officer for imports; the exact review separation and source evidence still need agreement.
5. Which exact academic score is ranked, for what period, and how are missing subjects/assessments handled?
6. For class rankings, should classes rank by the mean of student scores or another school-approved measure?
7. How should parent-to-child account links be established and corrected?
8. Which contact verification and invitation channel does the school actually maintain for each student?
9. What browsers, devices, languages, print requirements, and connectivity conditions must be supported for handover?

## 9. How to continue safely

1. Start from the latest GitHub main and inspect any Grok Build changes before assuming they are included.
2. Keep frontend work separate from backend integration while the user is reviewing the UI.
3. Use synthetic records for UI flows and testing.
4. Confirm open product rules before encoding them into calculations or import parsers.
5. Before a Supabase change, reconcile the current live schema with all migration files and the role decisions. Do not rerun migrations or assume old schema docs accurately describe production.
6. Implement backend changes in reviewable migration steps, with real role-policy checks before any live student data is imported.
7. Connect frontend only after the owner approves the integration scope and required keys/configuration are safely available.
8. Treat “ready for handover” as a verified outcome, not a visual impression. Verify role access, imports, attendance, ranking boundaries and ties, parent messaging, audit history, recovery, and mobile workflows in a safe staging environment.

## 10. Short description for a new collaborator

RUHUKA is Lycée de Kigali’s planned public website and secure school portal. It serves students, parents, teachers, the Dean of Studies, the Discipline Office, and the Headmaster through four portals. The school’s existing system remains the source of official discipline scores; RUHUKA imports and explains those records but does not change them. Teachers take attendance only for assigned classes. One daily main attendance drives attendance statistics, while optional follow-up lesson attendance is separate. Students and classes have distinct academic and discipline rankings with competition-style ties. A student can be flagged for academic results below 50%, discipline below 20/40, or more than five main-attendance absences; an Admin or Discipline Officer must review and clear the relevant category. Parents need a working school-message conversation, with the Discipline Officer able to see and answer it. The current website and portal flows are demo frontend, and Supabase is a partially built but not frontend-connected backend. The aim is a secure, low-workload system the school can run itself.
