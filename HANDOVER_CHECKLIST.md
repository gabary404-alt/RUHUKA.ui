# RUHUKA first handover checklist

Updated: 3 November 2026 (Africa/Kigali). Owner: project director; implementation: Codex.

This is the delivery tracker. A checked item means the specifically stated outcome was verified, not that its whole feature is production-ready. Open items may already have partial code. Each working session picks the next dependency-ready item, records evidence and reports completed IDs, blockers and any owner action. Reopen a checked item when later changes invalidate its evidence. No calendar promise overrides acceptance checks.

## Current position

Public main site is still a browser-local demonstration. PR #9 contains named notebook collections; PR #10 contains the connected pilot at /connected/ plus applied database migrations. The pilot is not the final portal. RUHUKA system (jsqiqxflgokfdooogcst) is the active database; the older ruhuka project is excluded. Owner email has an explicitly authorised temporary Headmaster role. No school roster is imported. SQL rollback tests passed; mocked/unit tests passed; real cross-device/mobile acceptance is outstanding.

Scope accepted 3 November: integrate backend alongside frontend. Retain AI and general learning answers. Defer parent portal/messaging, SMS, automatic promotion decisions, advanced charts/school-wide leaderboards, and elaborate interactive 3D. Keep manual school decisions and historical records. Two lightweight illustrations are approved for review. English first.

## A. Baseline and first outstanding checks

- [x] A01 Create this complete delivery tracker and record current state/accepted scope.
- [x] A02 Verify named notebooks preserve existing notes through creation, switching and reload using focused tests; fix observed issues.
- [x] A03 Verify notebook checklist editing, completion, removal, search and confirmed deletion with focused tests.
- [x] A04 Verify notebook storage failures and old-note migration without overwriting existing content.
- [ ] A05 Browser-check notebook on phone, tablet and desktop and all required Staff/Admin roles; record screenshots.
- [ ] A06 Reconcile older requirements/handoff documents with this accepted scope.
- [ ] A07 Reconcile applied database migrations, repository files and old draft PR #4; document reproducible baseline without resetting the live project.
- [ ] A08 Review PR #9 and #10 changes, resolve conflicts and mark only verified increments ready for review.

## B. Identity and access

- [x] B01 Identify active Supabase project and inspect schema/policies/migration history.
- [x] B02 Bootstrap owner's explicitly approved temporary Headmaster account and record audit.
- [ ] B03 Complete actual sign-in/sign-out tests on deployed pilot and remove stale-session exposure.
- [ ] B04 Finish session expiry/renewal/revocation tests including disabled accounts and role changes.
- [ ] B05 Implement student ID + password login without exposing emails or account enumeration.
- [ ] B06 Implement verified-email student invitations and first-password setup.
- [ ] B07 Implement private one-time school setup codes for students without usable email.
- [ ] B08 Implement audited Discipline Officer reset codes; no password visibility.
- [ ] B09 Implement password recovery/email delivery, expiry and replay protection.
- [ ] B10 Build Headmaster-only staff creation, role assignment and disabling.
- [ ] B11 Build Headmaster/Dean teacher-class assignments and verify revocation.
- [ ] B12 Enforce all agreed roles server-side; remove legacy broad admin loopholes.
- [ ] B13 Test Student, teacher, patron/matron, officer, Dean and Headmaster allow/deny cases.
- [ ] B14 Review auth security settings including existing leaked-password warning, email configuration and rate limits.

## C. Roster, calendar and historical records

- [ ] C01 Build Headmaster class/roster management with clear validation.
- [ ] C02 Support three terms with Headmaster-configured year/start/end dates.
- [ ] C03 Version class enrolments/year data so new-year changes preserve history.
- [ ] C04 Build individual student additions by Discipline Officers with HIGH priority Headmaster notice.
- [ ] C05 Restrict name/class/status edits to Headmaster; officer correction requests recorded.
- [ ] C06 Implement archived/transferred/graduated statuses with current-roster exclusions and historical access.
- [ ] C07 Obtain synthetic/redacted school roster, academic and discipline source examples.
- [ ] C08 Build Excel/CSV roster validation and changes preview; reject invalid batches as a whole.
- [ ] C09 Preserve omitted fields, avoid score changes and avoid automatic repeat invitations during roster updates.
- [ ] C10 Build Headmaster action-specific, one-successful-use roster import grants for officers.
- [ ] C11 Test concurrent grant consumption; failures do not consume grants.
- [ ] C12 Separate private guardian contacts from ordinary lookup/reports and test permissions.
- [ ] C13 Check duplicate IDs, mistaken imports, safe corrections and concurrent roster edits.

## D. Attendance daily workflow

- [x] D01 Enforce unique main register per class/day in database.
- [x] D02 Build validated transactional main submission; reject incomplete/wrong-class/duplicate-student/invalid-status rows in SQL tests.
- [x] D03 Block direct authenticated main-register insert bypasses in SQL tests.
- [x] D04 Test assigned teacher submission and school-wide patron submission without officer correction rights.
- [x] D05 Require officer correction reason and preserve before/after audit in SQL tests.
- [ ] D06 Integrate connected attendance into final Staff/Admin navigation with real identity, no demo selector.
- [ ] D07 Show school-local date, assigned/current classes, readable names and explicit statuses on phones.
- [ ] D08 Show submission review totals, pending/success/error status and clear duplicate warning.
- [ ] D09 Show missing/submitted classes, authenticated submitter display name/time and correction status.
- [ ] D10 Verify drafts restore for matching user/class/date and survive reload/network loss in actual browser.
- [ ] D11 Recheck server register on reconnect; preserve conflict evidence without silent overwrite.
- [ ] D12 Verify official totals exclude follow-up lessons, handle excused days and reset stale demo totals.
- [ ] D13 Build validated separate follow-up register workflow without changing main statistics.
- [ ] D14 Distinguish late arrival, present return and excused absence consistently in screens/reports.
- [ ] D15 Connect officer correction history UI and verify audit authenticity/visibility across roles.
- [ ] D16 Test simultaneous two-session submissions and no partial saves.
- [ ] D17 Verify teacher/patron submission appears on officer device, including reconnect/refresh behaviour.
- [ ] D18 Resolve concurrent class roster mutations while taking/submitting attendance.

## E. Absence explanations and concerns

- [x] E01 SQL-test student explanation submission and atomic officer approval changing linked absence to Excused.
- [x] E02 SQL-test privacy: submitting student/officer only; patron, Headmaster and Dean cannot read private explanations.
- [ ] E03 Verify rejected/repeated/stale reviews, duplicate requests and cross-student abuse; audit all decisions.
- [ ] E04 Complete student/officer explanation screens in final portals with readable context and decision state.
- [ ] E05 Add optional photo/PDF proof in private storage with type/size limits, retention and permission tests.
- [ ] E06 Ensure private attachments never appear in public URLs, logs, exports or AI requests.
- [ ] E07 Implement five consecutive recorded main school-day absence concerns; missing register is unknown.
- [ ] E08 Keep concerns open until reviewed; present/late/excused breaks the streak, not an already-open concern.
- [ ] E09 Implement reopening after closure without return and new streak after return.
- [ ] E10 Keep academic below 50% and discipline below 20/40 separate; per-category review/history.
- [ ] E11 Verify concerns produce staff follow-up tasks without automated disciplinary decisions.

## F. Academic releases and discipline imports

- [ ] F01 Build freely named dated academic releases, preserving older uploads and their rankings.
- [ ] F02 Parse individual subject marks/maxima and supplied overall final column from approved examples.
- [ ] F03 Distinguish missing marks from zero; compare weighted overall and warn on discrepancies.
- [ ] F04 Dean can review/fix or publish anyway with recorded unresolved warnings/override.
- [ ] F05 Rank supplied totals despite blank subjects; omit missing totals, use class ties 1,2,2,4.
- [ ] F06 Keep academic and discipline rankings separate, excluding inactive current records.
- [ ] F07 Dean publishes/corrects without Headmaster approval; preserve before/after and notify Headmaster.
- [ ] F08 Validate complete academic batches and prevent partial/double application.
- [ ] F09 Import official external discipline totals/evidence; remove manual point-changing routes.
- [ ] F10 Officer applies validated discipline imports without reviewer; notify Headmaster/fellow officers.
- [ ] F11 Reconcile old discipline-review constraints/functions and enforce authority at database level.
- [ ] F12 Preserve source evidence/import history; handle corrected imports and omitted fields safely.
- [ ] F13 Retain year/enrolment history and support explicit manual promote/repeat decisions if needed for handover; automatic promotion suggestions/decisions deferred.

## G. Daily work, notifications and reporting

- [ ] G01 Build role-specific Today dashboard from actual tasks/counts, each opening its relevant action.
- [ ] G02 Show missing attendance, explanations, unresolved upload issues and priority roster changes by permission.
- [ ] G03 Persist in-app notifications with actor/action/target/time and unread/read state.
- [ ] G04 Provide school-wide notices for Headmaster/Dean/officers and assigned-class teacher notices.
- [ ] G05 Deliver one student announcement feed with correct targeting/history.
- [ ] G06 Connect personal named notebooks/notes/checklists to signed-in user ownership; no shared staff notebook.
- [ ] G07 Verify notebook cross-account denial, reload/cross-device sync, conflicts and safe deletion.
- [ ] G08 Provide useful attendance/academic/discipline reports with consistent date/class/release filters.
- [ ] G09 Export Excel/CSV and print/PDF; totals match filtered screen and exclude private contacts.
- [ ] G10 Test one-click paths from Today items; remove duplicate or nonfunctional dashboard controls.

## H. AI, public website and visual polish

- [ ] H01 Retain existing AI and verify live provider success, failure, retry, cancellation and progressive display.
- [ ] H02 Move trusted instructions server-side; bound requests, timeout/cost/rate exposure and error diagnostics.
- [ ] H03 Keep private records/actions out of AI; test prompt abuse and accidental data transmission.
- [ ] H04 Use school-approved knowledge; disclose lack of live lookup, no fabricated freshness/citations.
- [ ] H05 Verify keyboard/screen-reader/reduced-motion chat behaviour.
- [ ] H06 Remove click sparks/cursor effects and unnecessary portal animation loops safely.
- [ ] H07 Create two approved lightweight original 3D-looking illustrations and show owner preview.
- [ ] H08 Make illustrations useful without animation; reduce motion and loading failures handled.
- [ ] H09 Replace unverified school claims/details with school-approved public information.
- [ ] H10 Implement meaningful Privacy, Terms and Support pages and verify every public navigation link.
- [ ] H11 Restrict public editing to Headmaster/named school-authorised editors; audit edits.

## I. Release verification and operational readiness

- [ ] I01 Test real narrow phone, tablet and desktop layouts, keyboard entry and navigation in all portals.
- [ ] I02 Test slow/interrupted connectivity, storage limits, offline drafts and retry without duplicate writes.
- [ ] I03 Check labels, focus, contrast, touch targets and screen-reader status/error announcements.
- [ ] I04 Separate preview/test/production configuration and prevent demo records entering real workflows.
- [ ] I05 Check keys, exposed endpoints, RLS/grants, storage, logs and dependency versions; no privileged frontend keys.
- [ ] I06 Configure error monitoring and an actionable support path without private data leakage.
- [ ] I07 Confirm backup/retention capability and perform a documented recovery exercise in an isolated environment.
- [ ] I08 Validate deployment rollback and database migration forward/recovery plan.
- [ ] I09 Run complete multi-role attendance → explanation → officer decision → report demonstration.
- [ ] I10 Run roster/import/results/announcements/notebook/account recovery acceptance scenarios.
- [ ] I11 Resolve critical/high defects, document accepted nonblocking limitations and repeat affected checks.

## J. School acceptance and first handover

- [ ] J01 Identify school decision maker and small pilot team; confirm actual daily attendance practice/import formats.
- [ ] J02 Agree acceptance scenarios, supported devices, data handling, ownership and recurring service costs.
- [ ] J03 Pilot with a small authorised group; collect task-completion time, mistakes and usability feedback.
- [ ] J04 Obtain school-approved roster/content/contact data and verify first import totals.
- [ ] J05 Create school-owned Headmaster account and service ownership/access; verify recovery before removing temporary access.
- [ ] J06 Retain historical actors/audit attribution during ownership transfer.
- [ ] J07 Provide short role guides, in-page help, admin setup/recovery instructions and walkthrough.
- [ ] J08 Remove demo role/password shortcuts, test users and sample claims from production.
- [ ] J09 Confirm school can take attendance, review explanations, publish results and recover access independently.
- [ ] J10 Director/school approve final acceptance evidence; deploy signed-off release and record version/date.
- [ ] J11 Agree post-handover support/contact, monitoring and update responsibility.
- [ ] J12 Deliver access inventory, costs, known limitations, deferred backlog and first-week follow-up arrangement.

## Owner/school inputs (request only when dependent work is ready)

School source-file examples; approved public wording/claims; school year/term dates; school-owned account identity; authorised pilot participants and acceptance decisions; service/email/billing ownership where needed. Never request passwords in chat. No owner action needed to start A02.

## Session log

- 3 Nov: Tracker created from requirements, approved scope changes, applied SQL and current PRs. Starting A02–A04. Evidence from prior sessions is limited to the explicitly checked SQL/setup items; browser acceptance remains open.

- 3 Nov session: A02–A04 completed. Seven focused notebook interaction/storage tests pass: collection preservation/switch/reload, checklist edit/toggle/remove/search, confirmed deletion, legacy migration, failed collection saves, blocked storage and malformed note preservation. Fixed misleading empty state in newly created notebooks, stale editor timestamp display and malformed stored-note crash. A05 browser/mobile verification remains open. No owner input needed for these fixes.

- 3 Nov A05 browser pass (in progress): actual Admin/Headmaster desktop route revealed missing collection CSS, an unintentionally visible creation form and poor dark-mode secondary-button contrast. Consolidating collection CSS in PR #10, enforcing hidden controls and using existing theme colours. A05 stays open until remaining roles and device sizes are verified. Browser API currently exposes no viewport resizing; component-width QA must be distinguished from actual phone keyboard/device testing.
