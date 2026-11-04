# RUHUKA first handover checklist

Updated: 4 November 2026 (Africa/Kigali). Owner: project director; implementation: Codex.

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
- [x] A06 Reconcile older requirements/handoff documents with this accepted scope.
- [ ] A07 Reconcile applied database migrations, repository files and old draft PR #4; document reproducible baseline without resetting the live project.
- [ ] A08 Review PR #9 and #10 changes, resolve conflicts and mark only verified increments ready for review.

## B. Identity and access

- [x] B01 Identify active Supabase project and inspect schema/policies/migration history.
- [x] B02 Bootstrap owner's explicitly approved temporary Headmaster account and record audit.
- [x] B03 Complete actual sign-in/sign-out tests on deployed pilot and remove stale-session exposure.
- [ ] B04 Finish session expiry/renewal/revocation tests including disabled accounts and role changes.
- [ ] B05 Implement student ID + password login without exposing emails or account enumeration.
- [ ] B06 Implement verified-email student invitations and first-password setup.
- [ ] B07 Implement private one-time school setup codes for students without usable email.
- [ ] B08 Implement audited Discipline Officer reset codes; no password visibility.
- [ ] B09 Implement password recovery/email delivery, expiry and replay protection.
- [ ] B10 Build Headmaster-only staff creation, role assignment and disabling.
- [x] B11 Build Headmaster/Dean teacher-class assignments and verify revocation.
- [ ] B12 Enforce all agreed roles server-side; remove legacy broad admin loopholes.
- [ ] B13 Test Student, teacher, patron/matron, officer, Dean and Headmaster allow/deny cases.
- [ ] B14 Review auth security settings including existing leaked-password warning, email configuration and rate limits.

## C. Roster, calendar and historical records

- [x] C01 Build Headmaster class/roster management with clear validation.
- [x] C02 Support three terms with Headmaster-configured year/start/end dates.
- [ ] C03 Version class enrolments/year data so new-year changes preserve history.
- [x] C04 Build individual student additions by Discipline Officers with HIGH priority Headmaster notice.
- [x] C05 Restrict name/class/status edits to Headmaster; officer correction requests recorded.
- [x] C06 Implement archived/transferred/graduated statuses with current-roster exclusions and historical access.
- [ ] C07 Obtain synthetic/redacted school roster, academic and discipline source examples.
- [ ] C08 Build Excel/CSV roster validation and changes preview; reject invalid batches as a whole.
- [ ] C09 Preserve omitted fields, avoid score changes and avoid automatic repeat invitations during roster updates.
- [ ] C10 Build Headmaster action-specific, one-successful-use roster import grants for officers.
- [ ] C11 Test concurrent grant consumption; failures do not consume grants.
- [x] C12 Separate private guardian contacts from ordinary lookup/reports and test permissions.
- [ ] C13 Check duplicate IDs, mistaken imports, safe corrections and concurrent roster edits.

## D. Attendance daily workflow

- [x] D01 Enforce unique main register per class/day in database.
- [x] D02 Build validated transactional main submission; reject incomplete/wrong-class/duplicate-student/invalid-status rows in SQL tests.
- [x] D03 Block direct authenticated main-register insert bypasses in SQL tests.
- [x] D04 Test assigned teacher submission and school-wide patron submission without officer correction rights.
- [x] D05 Require officer correction reason and preserve before/after audit in SQL tests.
- [ ] D06 Integrate connected attendance into final Staff/Admin navigation with real identity, no demo selector.
- [ ] D07 Show school-local date, assigned/current classes, readable names and explicit statuses on phones.
- [x] D08 Show submission review totals, pending/success/error status and clear duplicate warning.
- [x] D09 Show missing/submitted classes, authenticated submitter display name/time and correction status.
- [ ] D10 Verify drafts restore for matching user/class/date and survive reload/network loss in actual browser.
- [x] D11 Recheck server register on reconnect; preserve conflict evidence without silent overwrite.
- [x] D12 Verify official totals exclude follow-up lessons, handle excused days and reset stale demo totals.
- [x] D13 Build validated separate follow-up register workflow without changing main statistics.
- [x] D14 Distinguish late arrival, present return and excused absence consistently in screens/reports.
- [x] D15 Connect officer correction history UI and verify audit authenticity/visibility across roles.
- [ ] D16 Test simultaneous two-session submissions and no partial saves.
- [ ] D17 Verify teacher/patron submission appears on officer device, including reconnect/refresh behaviour.
- [ ] D18 Resolve concurrent class roster mutations while taking/submitting attendance.

## E. Absence explanations and concerns

- [x] E01 SQL-test student explanation submission and atomic officer approval changing linked absence to Excused.
- [x] E02 SQL-test privacy: submitting student/officer only; patron, Headmaster and Dean cannot read private explanations.
- [x] E03 Verify rejected/repeated/stale reviews, duplicate requests and cross-student abuse; audit all decisions.
- [ ] E04 Complete student/officer explanation screens in final portals with readable context and decision state.
- [ ] E05 Add optional photo/PDF proof in private storage with type/size limits, retention and permission tests.
- [ ] E06 Ensure private attachments never appear in public URLs, logs, exports or AI requests.
- [x] E07 Implement five consecutive recorded main school-day absence concerns; missing register is unknown.
- [x] E08 Keep concerns open until reviewed; present/late/excused breaks the streak, not an already-open concern.
- [x] E09 Implement reopening after closure without return and new streak after return.
- [x] E10 Keep academic below 50% and discipline below 20/40 separate; per-category review/history.
- [x] E11 Verify concerns produce staff follow-up tasks without automated disciplinary decisions.

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

- [x] G01 Build role-specific Today dashboard from actual tasks/counts, each opening its relevant action.
- [x] G02 Show missing attendance, explanations, unresolved upload issues and priority roster changes by permission.
- [x] G03 Persist in-app notifications with actor/action/target/time and unread/read state.
- [x] G04 Provide school-wide notices for Headmaster/Dean/officers and assigned-class teacher notices.
- [x] G05 Deliver one student announcement feed with correct targeting/history.
- [x] G06 Connect personal named notebooks/notes/checklists to signed-in user ownership; no shared staff notebook.
- [ ] G07 Verify notebook cross-account denial, reload/cross-device sync, conflicts and safe deletion.
- [ ] G08 Provide useful attendance/academic/discipline reports with consistent date/class/release filters.
- [ ] G09 Export Excel/CSV and print/PDF; totals match filtered screen and exclude private contacts.
- [x] G10 Test one-click paths from Today items; remove duplicate or nonfunctional dashboard controls.

## H. AI, public website and visual polish

- [ ] H01 Retain existing AI and verify live provider success, failure, retry, cancellation and progressive display.
- [ ] H02 Move trusted instructions server-side; bound requests, timeout/cost/rate exposure and error diagnostics.
- [ ] H03 Keep private records/actions out of AI; test prompt abuse and accidental data transmission.
- [ ] H04 Use school-approved knowledge; disclose lack of live lookup, no fabricated freshness/citations.
- [ ] H05 Verify keyboard/screen-reader/reduced-motion chat behaviour.
- [x] H06 Remove click sparks/cursor effects and unnecessary portal animation loops safely.
- [x] H07 Create two approved lightweight original 3D-looking illustrations and show owner preview.
- [x] H08 Make illustrations useful without animation; reduce motion and loading failures handled.
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


## K. Class letter (added 4 November; after reliable source records/reports)

- [ ] K01 Confirm school weekly/term class-summary practice and define class/date/year/release selection.
- [ ] K02 Build deterministic attendance summary with unique-student/absence-day distinction, returns and missing-register coverage.
- [ ] K03 Add separate selected academic release and dated official discipline details; preserve Not recorded and source attribution.
- [ ] K04 Keep editable narrative separate from generated metrics and enforce author/Headmaster permissions and explanation privacy.
- [ ] K05 Save reproducible versioned letter snapshots with source IDs, author and timestamp; later corrections create a new version.
- [ ] K06 Print school-branded letter with Strive to Excel, correct totals and unclipped supporting detail; no automatic external sending.
- [ ] K07 Run school acceptance examples and confirm the letter reduces retyping in practice; retain Today dashboard.

## Owner/school inputs (request only when dependent work is ready)

School source-file examples; approved public wording/claims; school year/term dates; school-owned account identity; authorised pilot participants and acceptance decisions; service/email/billing ownership where needed. Never request passwords in chat. No owner action needed to start A02.

## Session log

- 3 Nov: Tracker created from requirements, approved scope changes, applied SQL and current PRs. Starting A02–A04. Evidence from prior sessions is limited to the explicitly checked SQL/setup items; browser acceptance remains open.

- 3 Nov session: A02–A04 completed. Seven focused notebook interaction/storage tests pass: collection preservation/switch/reload, checklist edit/toggle/remove/search, confirmed deletion, legacy migration, failed collection saves, blocked storage and malformed note preservation. Fixed misleading empty state in newly created notebooks, stale editor timestamp display and malformed stored-note crash. A05 browser/mobile verification remains open. No owner input needed for these fixes.

- 3 Nov A05 browser pass (in progress): actual Admin/Headmaster desktop route revealed missing collection CSS, an unintentionally visible creation form and poor dark-mode secondary-button contrast. Consolidating collection CSS in PR #10, enforcing hidden controls and using existing theme colours. A05 stays open until remaining roles and device sizes are verified. Browser API currently exposes no viewport resizing; component-width QA must be distinguished from actual phone keyboard/device testing.

- 3 Nov A05 follow-up: corrected CSS deployed and rechecked in actual desktop Admin/Headmaster route. Creation form is hidden initially, + reveals it, successful named notebook creation selects it, and dark-mode controls are readable. Screenshot captured. Seven notebook tests still pass. Other roles, narrow/tablet browser viewports and phone keyboard remain unverified; A05 remains open.

- 3 Nov: A06 completed; requirements and historical handoff aligned to accepted scope. Private notebook storage applied; rollback tests passed for ownership, Headmaster isolation, stale-save rejection and student denial. G06/G07 remain open for interface integration and full cross-device/deletion checks. A05 remains open. Verified: 14/128. No owner action required.

- 3 Nov: B03 completed with actual deployed owner-account email/password sign-in and explicit Headmaster role, followed by signout returning to login and clearing visible private notebook content. G06/G07 progressed: account-private notebook created, note/body/checklist autosaved and reloaded from server; checklist remained complete. Only labelled synthetic setup content used, left in owner notebook RUHUKA setup checks. 37 automated tests pass; separate ownership/conflict SQL tests passed earlier. Full cross-device/mobile, real conflict recovery and final portal integration remain open. Tracker 15/121 verified. No merge recommendation yet.

- 4 Nov: Class letter reviewed (8/10 conditional on school reporting practice), scoped in CLASS_LETTER_BRIEF.md and added as K01–K07. Total now 128; 15 verified, 113 open. Notebook full-search/pagination replaces 200-note limit; SQL rollback suite tested 206 notes, pages beyond 200, body search/literal wildcard and cross-account denial. No extra boxes checked: browser/mobile and full feature acceptance remain open.

- 4 Nov five-item session: D08 completed in connected pilot with two-step review totals, explicit pending/success/error states and duplicate warning; mocked integration/pure-state tests pass. D09 completed with narrow authenticated submitter display-name helper and correction counts derived from audit (not timestamps); SQL and render tests pass. D11 completed with pre-submit and online-event server checks, preserving unsubmitted device drafts on conflict; mocked reconnect test passes, database unique index remains race protection. D15 completed in pilot with reason, before/after, actor/time history UI and authenticated database audit access; UI-render and SQL privacy/forgery tests pass. E03 completed via rollback SQL tests for rejection (attendance unchanged), replay, stale approval (request stays pending), duplicate pending and cross-student denial, plus audit decisions. Fixed confidential decision text exposure in workflow audit and changed attendance approval note to a neutral reference. 43 Node tests pass; extended SQL transaction passes. 20/128 verified. I01/I02/I09/D16/D17 retain actual device, connection-race and cross-session acceptance work; completed technical items do not imply handover readiness.

- 4 Nov second five-item session: D12 completed with database main-only date/class summary, excused denominator/null empty ranges, and removal of stale cached demo absence/rate baselines. D13 completed with validated transactional follow-up operation, duplicate lesson guard, separate pilot mode/name/draft key and read-only follow-up viewing; direct client inserts revoked. D14 completed with explicit Present/Late/Excused labels and separate official-summary counts; SQL tests verify midday Present, Late attended, Excused denominator and absence transitions. G06 completed: named notebooks/notes/checklists connected to account ownership, previous actual owner browser save/reopen evidence plus SQL test of all five required staff/admin roles and student denial. G07 remains cross-device/deletion/conflict acceptance. H06 completed: removed background/foreground star loops, click sparks, cursor/parallax and card tilt effects; globe remains visibility-paused; reduced-motion fallback added. Deployed landing/Admin notebook smoke passed, no application console errors. 46 Node tests and both extended SQL rollback suites pass. 25/128 verified. I01/I02/D16/D17 and final portal integration remain open. No owner action or merge needed yet.

- 4 Nov ten-item session: B11 Headmaster/Dean teacher directory and assignment/revocation operation/UI tested. C01 basic class creation and single-record roster management with validation built; bulk/year-versioning remain separate. C02 terms 1–3 with dates, overlap guard and Headmaster form tested. C04 officer single addition creates HIGH priority Headmaster notification. C05 direct edits Headmaster-only; officer requests loaded into edit form and atomically resolved on save. C06 Active/Transferred/Graduated/Archived states supported with retained attendance; current demo/pilot attendance/rankings exclude inactive students. C12 ordinary exports/lookup omit contacts; contact table restricted to Headmaster management and officer read; teacher/Dean/student/patron/legacy-admin denial tested. G03 private recipient notices with actor/action/target/priority/time/read state. G04 authorised school-wide and assigned-class publishing. G05 persistent targeted student feed (latest 100 explicitly labelled). 52 Node tests pass; school-operations SQL suite passes and rolls back all six fixtures. 35/128 verified. These are technical build/permission checks in pilot, not live school acceptance. D18 class-lock trigger is implemented but remains open pending simultaneous-session verification. No new owner access/decision needed. Keep PR #10 draft.


### PR #4 review — 4 November 2026
- Keep draft PR #4 unmerged: its three migration files are already applied, and its older portal changes must not overwrite current work.
- Recovered those three SQL files into the current PR #10 branch without its legacy UI changes.
- Applied and verified active-role checks for class/student reads. Rollback SQL covers active assigned teacher access, disabled teacher/student denial, and stale assignments after teacher role removal.
- A07 remains open until the full historical baseline is reconciled. B04 and B12 remain open pending broader session and role-matrix verification. No additional handover box is claimed by this review.


### Ten-item follow-up and Today session — 4 November 2026
E07–E11: persisted attendance/academic/discipline follow-ups, source references, category-specific human review, revision checks and review/reopening history. Attendance uses five consecutive submitted main registers; unsubmitted days are unknown, missing student marks break the recorded streak, follow-up lessons do not count, and Present/Late/Excused break a streak without auto-closing existing cases. A reviewed attendance case reopens only on a new recorded absence without a return; a new streak after a return creates separate history. Academic and discipline thresholds remain separate. Source adapter currently reads the latest applied subject batch (weighted by maximum marks) and latest applied discipline snapshot. Missing results are not fabricated as zero; final named-release/supplied-overall integration and school source validation remain F01–F08 work.
G01/G02/G10: role-specific Today tasks from real database counts, permitted explanation counts without confidential text, missing class registers, pending roster corrections, priority notices and unresolved upload-status records. UI opens the appropriate existing pilot route or read-only upload details; it explicitly says import correction is still being built. Cases refresh on opening Today and at 30-second intervals while visible; Today task counts poll every five seconds. No background delivery or real-time push is claimed.
H07/H08: two original local SVG illustrations created and previewed, replacing hero canvas globe/shooting stars and adding a school-day illustration to Today. Assets are approximately 2.1 KB and 1.7 KB, contain no scripts/external resources, and are readable without animation. Reduced motion disables the hero float; failed decorative images do not remove any controls or text.
Verification: 65 Node tests pass, extended SQL rollback suite passes, all seven synthetic test accounts removed by rollback. Vercel preview commit 7f0e20258f9299a94269ff99fcc45c93cdddd1de is READY; landing and both asset renders plus signed-out /connected/ entry were browser-checked. No new application console error observed (extension/Vercel login messages were excluded). Actual signed-in Today browser acceptance, narrow/tablet keyboard and cross-device work remain I01/I09/I10; no claim of school production readiness.
Tracker: 45/128 checked, 83 open. PR #10 stays draft/unmerged. No owner action required for this batch.
