# RUHUKA setup and first-handover runbook

Status: preview, not a production handover. Read HANDOVER_CHECKLIST.md and the latest verification report. The school-facing walkthrough is connected/guide.html; it links to account status and practical help. School ownership, email delivery and device acceptance remain unfinished. The isolated rehearsal and synthetic backup drill are documented in verification/ISOLATED_WORKSPACE_2026-11-11.md.

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
9. Complete student setup/recovery before promising optional student accounts. Student-ID login, one-time setup codes and audited reset codes are implemented; positive school/student/device acceptance is still pending. Staff use assigned email accounts. Never expose or retrieve another user's password.
10. Record agreed school support contact, provider owners, recurring cost limits, supported browsers/devices and acceptance evidence. These are school/director decisions, not facts the software can guess.

## Email setup and recovery: gates are currently OFF

Client config has staffInvitesEnabled=false and emailRecoveryEnabled=false. Supabase staff-accounts v3 also requires its server invitation flag; changing only the UI does not enable invitations. Do not turn these on merely because a preview build succeeds.

Before enabling: deploy the reviewed production account page, verify approved production Auth redirect/callback settings, configure an authorised sender/delivery service, and agree an actual recipient test. Verify first-password setup, reset, expired link, reused link and wrong/disabled account behaviour through actual email. Only then enable the corresponding client/server gates and run the invitation/recovery acceptance steps. Do not paste SMTP credentials, service-role keys, passwords or reset links into repository files, screenshots or support tickets. B06/B09/B10 remain open where their full stated outcome is not met.

If access fails today, use the account status page and contact the authorised administrator through the school's usual channel. Do not create a second account to bypass a missing role. Staff disabling revokes access server-side; changed/re-enabled roles require a fresh sign-in. If email is unavailable, do not promise that reset requests work.

## Correction and year-end walkthrough

- Attendance: correct an existing main record, provide the real reason through the authorised officer tool and check history. The class letter contains only correction counts, not that private reason.
- Results/discipline: open the source and create a reviewed replacement. A totals-only discipline correction keeps earlier evidence; an explicit new events file replaces it after preview. Earlier sources/letters remain immutable.
- Manual progression: Headmaster/Dean opens one student, selects review year/results/destination, writes the conclusion, reviews warnings and explicitly confirms. The Dean's default 50% threshold can be changed per year; it only highlights review. A later changed conclusion uses Correct this decision. Headmaster manages Graduated status separately. No automatic batch promotion exists.
- Class letter: choose explicit class/year/date/source releases, generate, read the fixed numbers and author explanation, confirm review, save for Headmaster and print. Later source corrections show a notice; a new letter version requires another review. No email/SMS or external sending occurs.

## Release and recovery

PR #10 is the integration draft. PR #4 is superseded database-source work; #9 is a postponed notebook UI. Keep them unmerged separately. See RELEASE_PLAN.md for the reviewed increment and gates. Preview acceptance is not production release approval.

Before production: complete account/device/role/file/AI and school acceptance, verify secret scopes and monitoring, confirm school-controlled managed backup/retention and verify the exact staged release. J10 remains open. Existing historical reset/schema scripts must never be rerun on the live project. A website rollback does not reverse a database migration; use the reviewed forward/recovery plan, not a project reset.

## Support and handover evidence

Record the failing screen/action, school-local date/time, visible status and whether records were saved. Keep screenshots redacted; never include passwords, medical evidence, guardian contacts or private explanations in public tickets or AI requests. Do not clear device drafts or reset the database as a general repair step. Readable retained data plus an honest visible error is safer than claiming a failed save succeeded.

The school's approved support contact, actual service costs, backup retention and full supported-device list are still awaiting confirmation. The final handover inventory must record these and accepted nonblocking limitations before J10/J12 can close.


Student account procedure: Headmaster or Discipline Officer opens School desk → Student account setup and reset, checks the exact student ID and confirms issuing a code. Deliver it privately to the student/authorised guardian. The code is displayed once, then hidden after two minutes or leaving the view; history never reveals it. Setup expires after 24 hours; reset after 20 minutes. A new code revokes earlier unused codes. The student enters ID/code and chooses a 12–128 character password on the account page, then signs in using Student. Headmaster can disable/enable a student account; old sessions and unused codes are invalidated. Officer issuance notifies the Headmaster with high priority.

A network/Auth failure after code consumption can leave a partial outcome: the interface says so. Try signing in; if it fails, ask for a fresh code after the five-minute processing guard. Do not assume a failed request completed. Codes/passwords must not be put into support tickets, messages, screenshots or audit notes. No email is sent by this workflow.

Student results print is a single published release, with recorded maxima, missing marks, supplied overall and saved rank. It is explicitly unofficial. Annual aggregation, grading bands, school logos/QR/signatures and official report acceptance await a readable school sample and confirmed rules.

Shared devices: leaving/hiding the account page clears unfinished password and code inputs. Return and re-enter them to continue. An already-submitted request may still complete; follow its final status or try sign-in before requesting another code. Signing out removes temporary browser print copies; documents already downloaded or printed cannot be withdrawn by sign-out.

## New roster and chatbot operating notes

Roster import accepts a CSV or one visible Excel .xlsx worksheet of up to 500 KB and 1,000 student rows. Use the CSV template header names and text-formatted IDs to preserve leading zeros. The workbook is read in the browser. Review each before/after row before confirming. Unsupported files, formulas and invalid rows stop the entire batch. This is the template format. The school-specific source review remains C07/F02.

Chat support logs only the fixed event name, failure class, HTTP status and random support reference. Ask for the reference and Kigali time. In Vercel Runtime Logs, select the appropriate deployment and search the reference in a short recent window. A preview 503 was traced this way. Preview has no live provider key. A configured live provider answered a harmless production test using the existing integration.

The preview does not call the paid provider. Before promotion, configure a production budget key and approved cap. Budget exhaustion and configuration failures fall back to local help. Configure RUHUKA_CHAT_BUDGET_SECRET and LDK_AI_API_KEY as production server environment values. Store only the budget key digest in the database. A deploy without these settings does not send paid provider requests.

## Ownership and release recovery rehearsal

First verify the successor's independent Headmaster sign-in and recovery. Disable the former profile and expire its sessions once the school approves retirement. Retain its Auth identity, profile, author IDs and audit references. Do not rename old events or reuse the same account for the successor. The rollback fixture verifies this sequence against an old announcement and its audit entry. Actual school ownership and sign-off remain J05/J10.

The preview branch alias was moved to the preceding ready deployment and then restored to the current deployment. The production alias was checked separately. For a release incident, first record the live deployment ID, current migration version, symptoms and the last known compatible build. Route traffic back only to an approved compatible build. Compare a read-only public entry, sign-in, and access boundaries before resuming ordinary writes.

Database changes recover separately from website routing. The new chat budget migration is additive and the prior build can coexist with it. Retire the former preview budget scope when clearing old staging configuration. The current preview cannot call the paid provider. Never replay the historical reset on the pilot or delete a database to match a website rollback. The synthetic recovery drill passed. Keep the complete managed backup and restore validation in the production release procedure.

## Preview and test configuration

On Vercel, `/connected/config.js` is served by the school configuration function. Enable **Automatically expose System Environment Variables** so the function can identify the environment. A normal preview serves the public page with its built-in content and keeps school sign-in and account setup closed. To enable connected pilot testing, set `RUHUKA_TEST_SUPABASE_URL` and `RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY` for that preview branch only, using a separate active Supabase project seeded with synthetic data. The function refuses the production URL and publishable key in a preview. School email gates stay closed. Use the newest PR #10 preview and verify the Test workspace banner. Older immutable previews predate the guard and should remain protected and retired from testing.

Before releasing, verify the school configuration route on the exact staged production build and confirm it uses the intended database. Verify the protected test preview can create a synthetic attendance register and that the live database counts are unaffected. Preview school-content queries use the same isolated project. Preview never invokes the paid chatbot provider. Production requires its own server-only chatbot budget secret.

## Recovery exercise

The current Supabase Free plan requires an owner-managed backup routine. The repository's schema replay verifies migration history and schema shape. An actual recovery exercise also needs exported data, Auth, and any separately managed Storage objects.

1. Choose an isolated restore project. Record source and destination project references, backup time, PostgreSQL major version, and the school owner's chosen backup frequency and retention.
2. In a secure operator environment, use the [Supabase CLI export and restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) to export roles, schema and data. Keep connection strings and exports in school-controlled restricted storage. Record checksums and keep secrets out of logs and the repository.
3. Restore to the isolated project. Use a restricted test URL, keep email disabled, and restore any required Storage objects separately. Verify migration history, role restrictions, a synthetic sign-in and attendance/report totals. Include Auth configuration, Edge Functions, and required secrets in the recovery inventory.
4. Record elapsed restore time, any data loss, the verification results and the clean-up owner. Record this as managed release evidence. The synthetic application drill already verified I07.

To rebuild a fresh managed test project, generate SQL with `python supabase/operations/build_schema_replay.py --hosted-test`. Apply it only to an empty isolated project. The SQL refuses a destination with application tables or Auth users. Deploy the student-access and staff-accounts functions separately, and leave mail off during synthetic rehearsal.

For the future Auth email rollout, test a template link to the exact approved account page with a URL fragment of `#token_hash={{ .TokenHash }}&type=recovery` or `type=invite`, as appropriate. The page removes the fragment before making requests and exchanges the hash with Auth before opening the password form. Keep the previous callback compatible while switching templates. Verify an actual received email, expired link and reused link before enabling production recovery or invitations.
