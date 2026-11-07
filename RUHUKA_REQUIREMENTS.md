## 7 November decisions — public school website and testing data

The public website serves visitors learning about Lycée de Kigali as well as the school community. Restore visitor navigation (Our school, Learning & school life, Contact); keep School sign in as a separate route into private tools. Publish only confirmed facts. Old-site combinations, clubs, leaders, contacts and statistics are proposals in verification/SCHOOL_CONTENT_PROPOSALS.md until director/school approval. Do not use old marketing content to invent privacy or service promises.

The director confirmed existing notes and old records are disposable development data. Preservation is no longer a first-handover requirement for those identified test records. Prepare targeted cleanup before real school import; keep the working director account, schema, security and deployment history. Do not reset the whole Supabase project or assume device data in other browsers was removed.

Staff accounts: Headmaster-only invitation, reviewed role assignment and disabling; recipients set their own passwords. Server-owned active roles determine access. Email delivery/redirect acceptance remains required. Roster import begins with explicit CSV template, server validation, before/after review, atomic apply and safe retry; no score/account/contact changes or repeated invitations. School Excel formats and officer import grants remain unfinished.

# RUHUKA first handover requirements
Updated 7 November 2026. Read this together with HANDOVER_CHECKLIST.md.

## Purpose
RUHUKA helps Lycée de Kigali staff record attendance, maintain school records and follow up work without repeatedly copying it. The site must be simple enough for routine staff use, especially on phones. Core attendance must work without each student owning a phone.

## Current implementation
The public page is a small introduction with real-account sign-in links. The role-checked workspace at /connected/ has Student, Staff and Admin navigation. It is a pilot, not a completed school release. The public production deployment has not been updated until a reviewed merge/release is authorised.
The active database is RUHUKA system (jsqiqxflgokfdooogcst). The older project is excluded. The owner's temporary Headmaster account is not the final school-owned handover account.

## Roles
- Teacher: main/follow-up attendance for assigned classes; assigned-class announcements.
- Patron/matron: school-wide attendance; no officer corrections or private concern reviews.
- Discipline Officer: attendance corrections with reasons/history, discipline follow-ups, single student additions with high-priority Headmaster notice, roster correction requests, relevant school notices.
- Dean of Studies: academic work and academic follow-ups, teacher assignments and school notices.
- Headmaster: roster/classes/terms, teacher assignments, priority notices, oversight and controlled school permissions.
- Student: own recorded academic/discipline/attendance information and targeted school announcements. No online absence-submission form.
Server permissions, not a browser role selector, decide access. No one can see a student's password.

## First-handover workflows
1. One submitted main register per class/day. Reject incomplete, invalid, duplicate or wrong-class marks atomically.
2. Separate follow-up lesson registers; these do not change official main-attendance totals.
3. Present/Late count as attended; Excused is separate. Missing records mean unknown, not absent or zero.
4. Officers correct submitted main attendance with a reason; retain original value, actor and time. Ordinary staff cannot overwrite another submission.
5. Today lists permitted missing registers, follow-up concerns, upload issues and priority roster notices. Each available control opens its real action.
6. Class/student management, three Headmaster-configured terms, teacher assignments, individual officer additions and protected bulk-import permissions.
7. Freely named academic releases and official discipline imports remain required. Different subject maxima are weighted; missing marks are not zero. Academic and discipline rankings stay separate. Dean/officer publish without a separate reviewer, with required notices/history.
8. Below-threshold concerns lead to human review, not automatic punishment or promotion. Attendance concerns use five consecutive recorded main absences; returns break a streak but do not silently close an open case.
9. School/class announcements and private recipient notifications retain targeting and history.
10. Account setup/recovery, student ID sign-in, complete imports, school-owned service/access transfer and real-device/multi-role acceptance must be completed before handover.
11. Class letters remain on the checklist after trustworthy sources/reports are ready. Generated numbers stay tied to records; editable wording stays separate.

## Design and AI
Keep the green identity, readable typography, compact layouts, book illustration and small original helper in the existing chat control. No heavy animation library, continuous canvas scene or extra floating mascot.
Use native scrolling. Load public-page code first; load optional chat only when opened. Do not generate sample school records on a normal page visit.
AI answers start with the answer, normally 2–4 short sentences or up to three short bullets. More detail is available when requested. Keep private records, credentials and actions out of the assistant. It has no live web search. Full rate/cost controls and configured live-provider testing remain open.

## Postponed
Personal notebooks for all Staff/Admin roles; online student absence submissions and proof uploads; parent portal/messaging; SMS; automatic promotion decisions; advanced charts/school-wide leaderboards; elaborate 3D.
Existing notes, device copies, private submissions and audit evidence are preserved. New student absence submissions are blocked at the database boundary. Historical privacy restrictions remain. Manual officer attendance corrections stay available.

## Delivery evidence
The checklist preserves all 128 original IDs and separates active and deferred work. Only verified outcomes are ticked. Mocked tests and SQL fixtures are not a substitute for actual school/device acceptance. Record limitations, open checks and any action needed from the director in plain language.
