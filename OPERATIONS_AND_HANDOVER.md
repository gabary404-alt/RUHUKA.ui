# RUHUKA setup and first-handover runbook

Status: preview, not a production handover. Read HANDOVER_CHECKLIST.md and the latest verification report. The school-facing walkthrough is connected/guide.html; it links to account status and practical help. School ownership, email delivery, recovery, device acceptance and isolated restore/rebuild remain unfinished.

## Daily roles

Teacher and patron/matron: take the main register and wait for school-submission confirmation. Officer: correct main attendance with reason/history, review attendance/discipline concerns, import official discipline records. Dean: publish reviewed academic results, assign teachers and review manual year-end decisions. Headmaster: configure classes/terms, manage staff/roster and read school reports/letters. Student: optional own-record/announcement access once an account is supplied. Daily staff work never requires each student to own a device.

Only the Headmaster and named active staff editors can publish public school text. Public visitors receive only the approved text projection, not staff identities, private versions, student records or the editing interface. A publishing editor must confirm school approval. Do not paste private notices or student records into public fields.

## Setup sequence before the first school pilot

1. Keep the existing director account until a school-owned Headmaster account has verified sign-in and recovery. Never delete the last working authorised owner. Record provider ownership and authorised support contacts separately; J05/J06 remain open.
2. Obtain approved school roster, result and discipline examples. Use redacted examples for format adaptation; do not infer missing marks or school facts from an outdated website. C07/F02/J04 remain open.
3. Create school classes with grade and year; configure each year's three term dates. Check nonoverlap. Configure next-year destination classes before manual promote/repeat review; class names must distinguish simultaneous historical/next-year classes.
4. Add or import a small authorised roster. Use check → compare before/after → apply. Headmaster can grant an officer one successful roster import within 24 hours. Failed validation does not consume it; single officer additions need no bulk-import grant and notify Headmaster.
5. Assign teachers to classes. Verify an assigned teacher sees the class and an unassigned teacher does not. Patron/matron access is school-wide for attendance, without officer correction rights.
6. Perform the staff pilot: teacher/patron main register → officer sees it → officer corrects with reason → report matches → class letter is saved/read. Use genuinely separate signed-in devices, including a phone, and retry a dropped connection. SQL fixtures do not replace this school/device exercise.
7. Publish reviewed academic and discipline sources using the strict pilot CSV templates. Confirm original school-file mapping before bulk school use. Test a missing mark, a real zero, a mismatch and an explicit correction. The original version must remain.
8. Review public wording with the school. Headmaster may nominate named editors, publish the approved five text sections and verify the visitor page. Blank/unavailable facts stay placeholders. No real school facts were published during development testing.
9. Complete student setup/recovery before promising optional student accounts. Student-ID login, setup codes and audited reset codes remain pending. Existing email sign-in is for assigned accounts; never expose or retrieve another user's password.
10. Record agreed school support contact, provider owners, recurring cost limits, supported browsers/devices and acceptance evidence. These are school/director decisions, not facts the software can guess.

## Email setup and recovery: gates are currently OFF

Client config has staffInvitesEnabled=false and emailRecoveryEnabled=false. Supabase staff-accounts v3 also requires its server invitation flag; changing only the UI does not enable invitations. Do not turn these on merely because a preview build succeeds.

Before enabling: deploy the reviewed production account page, verify approved production Auth redirect/callback settings, configure an authorised sender/delivery service, and agree an actual recipient test. Verify first-password setup, reset, expired link, reused link and wrong/disabled account behaviour through actual email. Only then enable the corresponding client/server gates and run the invitation/recovery acceptance steps. Do not paste SMTP credentials, service-role keys, passwords or reset links into repository files, screenshots or support tickets. B06/B09/B10/B14 remain open where their full stated outcome is not met.

If access fails today, use the account status page and contact the authorised administrator through the school's usual channel. Do not create a second account to bypass a missing role. Staff disabling revokes access server-side; changed/re-enabled roles require a fresh sign-in. If email is unavailable, do not promise that reset requests work.

## Correction and year-end walkthrough

- Attendance: correct an existing main record, provide the real reason through the authorised officer tool and check history. The class letter contains only correction counts, not that private reason.
- Results/discipline: open the source and create a reviewed replacement. A totals-only discipline correction keeps earlier evidence; an explicit new events file replaces it after preview. Earlier sources/letters remain immutable.
- Manual progression: Headmaster/Dean opens one student, selects review year/results/destination, writes the conclusion, reviews warnings and explicitly confirms. The Dean's default 50% threshold can be changed per year; it only highlights review. A later changed conclusion uses Correct this decision. Headmaster manages Graduated status separately. No automatic batch promotion exists.
- Class letter: choose explicit class/year/date/source releases, generate, read the fixed numbers and author explanation, confirm review, save for Headmaster and print. Later source corrections show a notice; a new letter version requires another review. No email/SMS or external sending occurs.

## Release and recovery

PR #10 is the integration draft. PR #4 is superseded database-source work; #9 is a postponed notebook UI. Keep them unmerged separately. See RELEASE_PLAN.md for the reviewed increment and gates. Preview acceptance is not production release approval.

Before production: complete account/device/role/file/AI and school acceptance, verify secret scopes and monitoring, confirm actual backup/retention capability, and perform isolated restore/rebuild and deployment rollback exercises. A07/I05–I10/J10 remain open as applicable. Existing historical reset/schema scripts must never be rerun on the live project. A website rollback does not reverse a database migration; use the reviewed forward/recovery plan, not a project reset.

## Support and handover evidence

Record the failing screen/action, school-local date/time, visible status and whether records were saved. Keep screenshots redacted; never include passwords, medical evidence, guardian contacts or private explanations in public tickets or AI requests. Do not clear device drafts or reset the database as a general repair step. Readable retained data plus an honest visible error is safer than claiming a failed save succeeded.

The school's approved support contact, actual service costs, backup retention and full supported-device list are still awaiting confirmation. The final handover inventory must record these and accepted nonblocking limitations before J10/J12 can close.
