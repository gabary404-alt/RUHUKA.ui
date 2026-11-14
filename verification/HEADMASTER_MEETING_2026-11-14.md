# Headmaster meeting and testing release — 14 November 2026

## Decisions and open facts
- The director will first test the system, then involve school staff. Production email gabary404@gmail.com was last verified as Headmaster; no role change is part of this update.
- The isolated role-testing account remains uncreated. The previous failed GitHub dashboard sign-in was separate from the school account. No evidence of account damage was observed.
- Current school systems and current attendance handoff are unknown. The proposed daily activity board is a desired workflow, not evidence of the existing process.
- The director reports printed term report cards and class rankings on notice boards. The upstream process for collecting/calculating marks is still unknown. Printed outputs do not prove no spreadsheet exists.
- RUHUKA supplies initial support; responsibilities and school ownership must be agreed.
- Rwanda section is text-only. Prefer an approved real Kigali photograph with muted greens and soft daylight; keep the original, serve compressed responsive sizes. No additional generated image is necessary now.

## Ask the Headmaster
1. What are the three most time-consuming administrative tasks? Who does each, how often, and approximately how long does the complete task take?
2. Which systems/registers are compulsory today (including Karame, SDMS, Excel and paper)? Which record is authoritative? What duplication must remain?
3. Who takes attendance, at what times, and how does the officer receive it today? Who follows up missing submissions, handles lateness/excused absences, and may correct a record?
4. How do subject teachers submit marks before printed rankings and report cards are produced? Who calculates/checks them?
5. Provide blank or anonymised roster, marks sheet, midterm class-ranking print and term report card with their real headings. Confirm subject maxima, weighting, missing marks, ties, rounding and approval/signature rules.
6. Which reports does each administrator need, how often, and how long do they take? Would the proposed class letter replace an existing task?
7. Confirm current academic programmes/combinations by year level, teaching languages and any admission requirements, dates, documents and official enquiry route approved for publication.
8. Confirm currently active clubs, sports and facilities; provide dated achievements and approved supporting evidence. Confirm the approximate alumni figure.
9. Supply approved leadership names, exact titles, short introductions and matching portraits. Who approves public content and keeps it current?
10. Confirm official logo, school name/motto, address/map pin, phone, email, office/visiting hours and official domain.
11. Approve photography locations and publication permissions: entrance/main building, real school activity, library/lab/classroom, sports facilities, leadership portraits, and a suitable Kigali view. Who can authorise identifiable people in photos?
12. Choose pilot participants for each role, representative classes, dates and devices. What internet/power constraints and shared-phone practices should we test?
13. Agree who can create accounts, assign/revoke roles, recover access and approve corrections. Confirm records retention, access and export expectations.
14. Confirm school ownership of domain/service accounts, named recovery contacts, backup/restore responsibility, RUHUKA support contact/hours and escalation.
15. Agree measurable acceptance: correct records, staff completing tasks independently, no lost/duplicate submissions and demonstrable reduction in an agreed task. Who signs off, and on what date?

## Bring back
Approved content/programme/club list; leadership details and photos; approved campus photos; blank/anonymised input and output examples; named pilot/decision contacts; mandatory-system list; report and calculation rules.

## Product priorities pending evidence
- Highest potential addition: a practical marks-entry path if teachers genuinely work only on paper. Do not force staff to invent an upload spreadsheet; confirm the current source first.
- Finish school-approved report-card and printable class-ranking output after layout/calculation approval. Keep class-wide rankings within authorised staff tools, not public web pages.
- Confirm daily attendance board and correction history meet the officer's needs; these already exist and need role trials, not another duplicate dashboard.
- Add approved admissions/visitor guidance and leadership content when supplied.
- Defer fees, payroll, transport, library management, parent messaging, SMS and extra AI modules unless an owner proves a priority gap.
- Deprioritise class letters if the school does not need them. Do not measure success by feature count.

## Merge and rollback
PR #10 replaces the old site/demo with the public school site and authenticated workspace. It is a visible production change. Latest release checks and preview must pass before merge; school acceptance remains separate.
Only merge #10; #4 is superseded and #9 is deferred.
After merge, wait for production deployment and verify the homepage and /connected/ sign-in. The existing production Headmaster account is separate from preview accounts.
For durable code rollback, revert the merge through a new reviewed PR and deploy it. An emergency Vercel rollback can restore the prior production deployment; restore normal promotion afterwards. Neither action undoes database records, configuration changes or migrations. Never reset the database to roll back the appearance.
No database migration or account change is included in this theme update.
Current handover count remains 98 verified, 18 open, 12 postponed. Planning documents and director testing do not close school acceptance checks.

## Theme change validation
A 280ms colour transition and 320ms icon rotation run only after a theme click, using CSS with no added library. Reduced-motion preferences disable both effects. Existing theme persistence and accessible labels remain.
184 automated tests pass. The 51-file build and local-link/demo-exclusion checks pass.
Local Chromium could not launch because this runtime denied its socket operation; visual browser verification of this increment remains outstanding until a hosted browser check succeeds.
