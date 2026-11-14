# RUHUKA first handover checklist

Updated: 13 November 2026 (Africa/Kigali). Owner: project director; implementation: Codex.

This is the delivery tracker. A checked item means the specifically stated outcome was verified, not that its whole feature is production-ready. Open items may already have partial code. Each working session picks the next dependency-ready item, records evidence and reports completed IDs, blockers and any owner action. Reopen a checked item when later changes invalidate its evidence. No calendar promise overrides acceptance checks.

## Current position

PR #10 is being prepared for director testing on the live domain, not school handover. Production is still main commit 82bc3a2a39b6ed490a8b72097518721918e46a33 until the director merges. The reviewed starting preview is ff824630edc542dbd3b42ac11673b5bce858bb42. The 13 November public design, real campus map, visible chat Close button and same-tab navigation are included.

The production Headmaster account is active and email-confirmed. Production has zero classes and students. Preview uses a separate isolated test database; accounts and records do not carry between them. Email invitation and recovery gates remain disabled pending delivered-email verification. The production AI budget is now configured separately: 8 provider reservations per minute and 80 per UTC day. This is a request ceiling, not a monetary budget or provider billing guarantee.

**98 verified / 18 open / 12 deferred.** None of the school-dependent acceptance items is closed by a build or merge. See DIRECTOR_TESTING.md for the test sequence and verification/DIRECTOR_RELEASE_2026-11-13.md for this session. Production smoke checks must follow the merge; final school acceptance, ownership and support are separate.

### Agreed first-handover scope — 5 November 2026

- Make the existing design lighter, more compact and reliable on phones first, then tablets and desktop. Correct scrolling before adding visual polish. Preserve useful spacing, legibility, touch targets and RUHUKA's green identity.
- Keep AI, but make answers direct and short by default. Answer the question first; normally use 2–4 short sentences or at most 3 short bullets. Avoid generic introductions, repetition and long unsolicited explanations. More detail can be supplied when requested or necessary. Keep existing privacy and accessibility protections.
- Defer student absence-justification submission, including proof uploads and related first-handover entry points. This does not remove ordinary attendance or Discipline Officer corrections to Present/Late/Excused. Existing submissions are development tests and may be removed in a targeted pre-handover cleanup. Do not delete real school data or reset the project.
- Defer the personal Notebook in both Academic/Discipline Staff and every Admin role. Visible entry points are removed. Existing test notes need not be retained; targeted cleanup may remove them while keeping account security and database structure.
- Keep the Student Portal's other approved views unless separately changed. Staff daily work must function without every student owning a phone/computer or submitting something online. Removing absence justification alone does not solve device access for every remaining student-facing feature.
- Parent portal/messaging, SMS, automatic promotion decisions, advanced charts/school-wide leaderboards and elaborate 3D remain deferred. Existing lightweight illustrations may remain only if they meet the performance/readability target; do not add new decorative complexity.
- Preserve attractive visual character with the existing lightweight book illustration and a small original LDK/RUHUKA helper face in the existing chat launcher/header. The 7 November approved addition is six stationary CSS star points on the public hero, with no animation. No new floating widget, copied third-party mascot, canvas scene or animation library. The helper asset is 971 bytes and remains static; typography, colour and simple borders provide the rest of the character.
- A universal guarantee for every device/browser is not a valid acceptance criterion. Test an explicit matrix of common supported devices/browsers, with simple static/readable fallbacks and slow-network behaviour.

### Revised tracker accounting

The original **128 IDs are preserved**: **116 active first-handover checks (98 verified, 18 open)** plus **12 deferred feature records**. Seven of the deferred records were previously technically verified; that work is retained as history, not counted as required first-handover delivery.

A06, G01, G02, G10 and H10 have been revalidated for the reduced scope. Their technical checks pass; full signed-in device acceptance remains separate. I01 remains open for the complete physical device and browser matrix. See the latest session evidence for the separate role and network checks.

### Implementation order (remaining acceptance mapped to existing IDs)

1. A08: prepare the reduced-scope release plan and reconcile old PRs. Do not merge old notebook/explanation UI just because its tests once passed.
2. I01: replace custom wheel interception/animated scrolling with reliable native scrolling; inspect body/portal/modal/table/chat overflow, focus, touch and back navigation. Never suppress a normal scroll gesture without a necessary accessible reason.
3. I02: establish measured load/render baselines; reduce continuous canvas/animation work, expensive blur/transparency, unnecessary startup scripts and hidden-portal/demo work. Load nonessential features only when needed; keep critical staff work usable if optional assets fail.
4. I01/I03/J02: verify representative narrow widths (320/360/390px), tablet (768px), desktop (1024/1280px), landscape, zoom and phone-keyboard behaviour on agreed browsers. Real device checks remain required; a desktop screenshot is not phone acceptance.
5. H09: shorten generic/repeated copy and oversized gaps/hero sections/cards. Keep necessary instructions and comfortable readable/tappable controls.
6. H01/H02/H05: apply concise chat instructions and output limits, test short practical answers and optional requested detail, and preserve keyboard/focus/reduced-motion/announcement behaviour.
7. A08/D06: remove new student absence-submission buttons/forms/navigation and proof-upload promises from all affected demo/pilot entry points. Review the direct submission API exposure for the deferred feature; preserve old records/privacy and staff correction rights.
8. A08: remove Staff/Admin notebook shortcuts, widgets and entry points across all roles and the connected pilot. Keep private ownership/migration structure; old test notes may be removed by the agreed targeted cleanup.
9. G01/G02/G10/H10: align Today counts/actions, AI help, public feature claims and support/privacy guidance with the reduced scope. Keep historical data accessible only where authorised and do not advertise unavailable flows.
10. I01/I02/I03/I09/I10: demonstrate the retained daily staff workflow on the supported device/network matrix, then review a concrete preview before any merge/production release.

### Read-only review evidence — 5 November 2026

- GitHub main and PR #10 remain separate; PR #10 is open/draft/unmerged. Vercel reports production (main) and latest PR #10 preview READY.
- Live https://ruhukaui.vercel.app/ still renders four canvas elements (click spark, background stars, globe, foreground stars) and loads main portal/demo scripts plus notebook.js at startup.
- Production script.js still has a custom wheel listener with preventDefault(), a requestAnimationFrame scroll loop and global CSS smooth scrolling. The PR #10 script still contains the custom wheel path even though other animation loops were removed.
- At the observed 1348px desktop viewport, the hero is 936px tall. A normal downward browser scroll gesture was followed by scrollY=0; this is a concrete desktop reproduction to investigate, not evidence about every phone/browser.
- Production has multiple blur/backdrop-filter effects, reveal transitions and long promotional sections. These are code/layout observations, not a measured CPU/network benchmark or proof that any single effect causes every device problem.
- The current preview AI server policy permits up to 800 output tokens and lacks the newly requested concise-answer rule.
- Production still advertises student absence justification; the current connected preview still exposes notebook controls. No such feature was removed during this review.
- No signed-in school account, private note or student record was opened, changed or deleted during this review.

## A. Baseline and first outstanding checks

- [x] A01 Create this complete delivery tracker and record current state/accepted scope.
- [x] A06 Reconcile requirements, historical handoff and pilot help with the 5 November scope: lighter UI, concise AI, deferred student absence submissions and Staff/Admin notebooks.
- [x] A07 Reconcile applied database migrations, repository files and old draft PR #4; document reproducible baseline without resetting the live project.
- [x] A08 Reconcile PR #4/#9/#10 against the revised first-handover scope; exclude notebook/student-explanation feature exposure, preserve historical data/migrations, resolve conflicts and prepare a reviewed release increment.

## B. Identity and access

- [x] B01 Identify active Supabase project and inspect schema/policies/migration history.
- [x] B02 Bootstrap owner's explicitly approved temporary Headmaster account and record audit.
- [x] B03 Complete actual sign-in/sign-out tests on deployed pilot and remove stale-session exposure.
- [x] B04 Finish session expiry/renewal/revocation tests including disabled accounts and role changes.
- [x] B05 Implement student ID + password login without exposing emails or account enumeration.
- [ ] B06 Implement verified-email student invitations and first-password setup.
- [x] B07 Implement private one-time school setup codes for students without usable email.
- [x] B08 Implement audited Discipline Officer reset codes; no password visibility.
- [ ] B09 Implement password recovery/email delivery, expiry and replay protection.
- [ ] B10 Build Headmaster-only staff creation, role assignment and disabling.
- [x] B11 Build Headmaster/Dean teacher-class assignments and verify revocation.
- [x] B12 Enforce all agreed roles server-side; remove legacy broad admin loopholes.
- [x] B13 Test Student, teacher, patron/matron, officer, Dean and Headmaster allow/deny cases.
- [x] B14 Review auth security settings including existing leaked-password warning, email configuration and rate limits.

## C. Roster, calendar and historical records

- [x] C01 Build Headmaster class/roster management with clear validation.
- [x] C02 Support three terms with Headmaster-configured year/start/end dates.
- [x] C03 Version class enrolments/year data so new-year changes preserve history.
- [x] C04 Build individual student additions by Discipline Officers with HIGH priority Headmaster notice.
- [x] C05 Restrict name/class/status edits to Headmaster; officer correction requests recorded.
- [x] C06 Implement archived/transferred/graduated statuses with current-roster exclusions and historical access.
- [ ] C07 Obtain synthetic/redacted school roster, academic and discipline source examples.
- [x] C08 Build Excel/CSV roster validation and changes preview; reject invalid batches as a whole.
- [x] C09 Preserve omitted fields, avoid score changes and avoid automatic repeat invitations during roster updates.
- [x] C10 Build Headmaster action-specific, one-successful-use roster import grants for officers.
- [x] C11 Test concurrent grant consumption; failures do not consume grants.
- [x] C12 Separate private guardian contacts from ordinary lookup/reports and test permissions.
- [x] C13 Check duplicate IDs, mistaken imports, safe corrections and concurrent roster edits.

## D. Attendance daily workflow

- [x] D01 Enforce unique main register per class/day in database.
- [x] D02 Build validated transactional main submission; reject incomplete/wrong-class/duplicate-student/invalid-status rows in SQL tests.
- [x] D03 Block direct authenticated main-register insert bypasses in SQL tests.
- [x] D04 Test assigned teacher submission and school-wide patron submission without officer correction rights.
- [x] D05 Require officer correction reason and preserve before/after audit in SQL tests.
- [x] D06 Integrate connected attendance into final Staff/Admin navigation with real identity; remove demo role selectors and do not require a student device/login to complete daily attendance. Student absence-submission entry points are deferred.
- [x] D07 Show school-local date, assigned/current classes, readable names and explicit statuses on phones.
- [x] D08 Show submission review totals, pending/success/error status and clear duplicate warning.
- [x] D09 Show missing/submitted classes, authenticated submitter display name/time and correction status.
- [x] D10 Verify drafts restore for matching user/class/date and survive reload/network loss in actual browser.
- [x] D11 Recheck server register on reconnect; preserve conflict evidence without silent overwrite.
- [x] D12 Verify official totals exclude follow-up lessons, handle excused days and reset stale demo totals.
- [x] D13 Build validated separate follow-up register workflow without changing main statistics.
- [x] D14 Distinguish late arrival, present return and excused absence consistently in screens/reports.
- [x] D15 Connect officer correction history UI and verify audit authenticity/visibility across roles.
- [x] D16 Test simultaneous two-session submissions and no partial saves.
- [x] D17 Verify teacher/patron submission appears on officer device, including reconnect/refresh behaviour.
- [x] D18 Resolve concurrent class roster mutations while taking/submitting attendance.

## E. Attendance, academic and discipline concerns (student submissions deferred)

- [x] E07 Implement five consecutive recorded main school-day absence concerns; missing register is unknown.
- [x] E08 Keep concerns open until reviewed; present/late/excused breaks the streak, not an already-open concern.
- [x] E09 Implement reopening after closure without return and new streak after return.
- [x] E10 Keep academic below 50% and discipline below 20/40 separate; per-category review/history.
- [x] E11 Verify concerns produce staff follow-up tasks without automated disciplinary decisions.

## F. Academic releases and discipline imports

- [x] F01 Build freely named dated academic releases, preserving older uploads and their rankings.
- [ ] F02 Parse individual subject marks/maxima and supplied overall final column from approved examples.
- [x] F03 Distinguish missing marks from zero; compare weighted overall and warn on discrepancies.
- [x] F04 Dean can review/fix or publish anyway with recorded unresolved warnings/override.
- [x] F05 Rank supplied totals despite blank subjects; omit missing totals, use class ties 1,2,2,4.
- [x] F06 Keep academic and discipline rankings separate, excluding inactive current records.
- [x] F07 Dean publishes/corrects without Headmaster approval; preserve before/after and notify Headmaster.
- [x] F08 Validate complete academic batches and prevent partial/double application.
- [x] F09 Import official external discipline totals/evidence; remove manual point-changing routes.
- [x] F10 Officer applies validated discipline imports without reviewer; notify Headmaster/fellow officers.
- [x] F11 Reconcile old discipline-review constraints/functions and enforce authority at database level.
- [x] F12 Preserve source evidence/import history; handle corrected imports and omitted fields safely.
- [x] F13 Retain year/enrolment history and support explicit manual promote/repeat decisions if needed for handover; automatic promotion suggestions/decisions deferred.

## G. Daily work, notifications and reporting

- [x] G01 Recheck role-specific Today dashboard against the revised scope; use actual permitted tasks/counts, without notebook shortcuts or new student-explanation tasks.
- [x] G02 Show missing attendance, unresolved upload issues and priority roster changes by permission; remove deferred student-explanation prompts and avoid presenting deferred workflows as available.
- [x] G03 Persist in-app notifications with actor/action/target/time and unread/read state.
- [x] G04 Provide school-wide notices for Headmaster/Dean/officers and assigned-class teacher notices.
- [x] G05 Deliver one student announcement feed with correct targeting/history.
- [x] G08 Provide useful attendance/academic/discipline reports with consistent date/class/release filters.
- [x] G09 Export Excel/CSV and print/PDF; totals match filtered screen and exclude private contacts.
- [x] G10 Recheck every Today action after scope reduction; remove dead/duplicate controls and all deferred notebook/student-explanation paths.

## H. AI, public website and visual polish

- [x] H01 Make chatbot replies direct and concise by default (normally 2–4 short sentences or up to 3 short bullets; answer first, no filler); allow more detail only when requested/needed. Verify configured live provider, failure, retry, stop and accessible progressive display.
- [x] H02 Enforce trusted server instructions and concise response/output limits; finish durable rate/cost controls, timeouts and safe diagnostics without exposing private records.
- [x] H03 Keep private records/actions out of AI; test prompt abuse and accidental data transmission.
- [x] H04 Use school-approved knowledge; disclose lack of live lookup, no fabricated freshness/citations.
- [x] H05 Verify keyboard/screen-reader/reduced-motion chat behaviour.
- [x] H06 Remove click sparks/cursor effects and unnecessary portal animation loops safely.
- [x] H07 Create two approved lightweight original 3D-looking illustrations and show owner preview.
- [x] H08 Make illustrations useful without animation; reduce motion and loading failures handled.
- [x] H09 Remove repetitive/generic promotional copy and unnecessary spacing; retain useful school information, readable text/touch targets and RUHUKA identity. Replace unverified school claims/details only with approved information.
- [x] H10 Keep Privacy, Terms and Support links working; revise their content for the deferred notebook/student-explanation scope, honest storage/AI limitations and practical staff help; recheck public navigation.
- [x] H11 Restrict public editing to Headmaster/named school-authorised editors; audit edits.

## I. Release verification and operational readiness

- [ ] I01 Verify native scrolling, keyboard/focus and layouts on the agreed phone/tablet/desktop matrix; include main page, Staff/Admin/retained Student views, chat, tables, modals and phone keyboard. Fix scroll traps, overflow and oversized empty sections.
- [x] I02 Measure initial JS/CSS/asset weight and loading work before/after; reduce decorative rendering and unused/hidden-portal startup work. Test slow/interrupted connections, storage limits, offline attendance drafts and duplicate-safe retry.
- [x] I03 Check labels, focus, contrast, touch targets and screen-reader status/error announcements.
- [x] I04 Separate preview/test/production configuration and prevent demo records entering real workflows. Verified the isolated managed test project, preview config, hosted role writes and unchanged production counts.
- [x] I05 Check keys, exposed endpoints, RLS/grants, storage, logs and dependency versions; no privileged frontend keys.
- [x] I06 Configure error monitoring and an actionable support path without private data leakage.
- [x] I07 Confirm backup/retention capability and perform a documented recovery exercise in an isolated environment. Verified a fresh restore of a representative synthetic archive. School-controlled managed backups and retention remain release requirements.
- [x] I08 Validate deployment rollback and database migration forward/recovery plan.
- [x] I09 Run the retained multi-role attendance → Discipline Officer correction with reason/history → report demonstration, without requiring student online submissions.
- [x] I10 Run roster/import/results/announcements/account recovery acceptance scenarios; confirm deferred notebook and student-explanation entry points are absent.
- [ ] I11 Resolve critical/high defects, document accepted nonblocking limitations and repeat affected checks.

## J. School acceptance and first handover

- [ ] J01 Identify school decision maker and small pilot team; confirm actual daily attendance practice/import formats.
- [ ] J02 Agree acceptance scenarios and a realistic supported device/browser matrix, phone-first usability, data handling, ownership and recurring costs. Core school work must not depend on each student owning a device.
- [ ] J03 Pilot with a small authorised group; collect task-completion time, mistakes and usability feedback.
- [ ] J04 Obtain school-approved roster/content/contact data and verify first import totals.
- [ ] J05 Create school-owned Headmaster account and service ownership/access; verify recovery before removing temporary access.
- [x] J06 Retain historical actors/audit attribution during ownership transfer.
- [x] J07 Provide short role guides, in-page help, admin setup/recovery instructions and walkthrough.
- [ ] J08 Remove demo role/password shortcuts, test users and sample claims from production.
- [ ] J09 Confirm staff can take/correct attendance, review follow-up concerns, publish results and recover access independently, without student-device dependence.
- [ ] J10 Director/school approve final acceptance evidence; deploy signed-off release and record version/date.
- [ ] J11 Agree post-handover support/contact, monitoring and update responsibility.
- [x] J12 Deliver access inventory, costs, known limitations, deferred backlog and first-week follow-up arrangement.


## K. Class letter (added 4 November; after reliable source records/reports)

- [ ] K01 Confirm school weekly/term class-summary practice and define class/date/year/release selection.
- [x] K02 Build deterministic attendance summary with unique-student/absence-day distinction, returns and missing-register coverage.
- [x] K03 Add separate selected academic release and dated official discipline details; preserve Not recorded and source attribution.
- [x] K04 Keep editable narrative separate from generated metrics and enforce author/Headmaster permissions and explanation privacy.
- [x] K05 Save reproducible versioned letter snapshots with source IDs, author and timestamp; later corrections create a new version.
- [x] K06 Print school-branded letter with Strive to Excel, correct totals and unclipped supporting detail; no automatic external sending.
- [ ] K07 Run school acceptance examples and confirm the letter reduces retyping in practice; retain Today dashboard.

## Deferred feature records — retained for later, excluded from first handover

These original IDs are not active release checkboxes. “Previously verified” preserves technical evidence only; the active UI now hides these features, blocks new absence submissions, and preserves prior records. Earlier session logs describe the old scope and do not override the current decision.

| Original ID | Previous technical status | Deferred work |
|---|---|---|
| A02 | Previously verified | Verify named notebooks preserve existing notes through creation, switching and reload using focused tests; fix observed issues. |
| A03 | Previously verified | Verify notebook checklist editing, completion, removal, search and confirmed deletion with focused tests. |
| A04 | Previously verified | Verify notebook storage failures and old-note migration without overwriting existing content. |
| A05 | Not complete | Browser-check notebook on phone, tablet and desktop and all required Staff/Admin roles; record screenshots. |
| E01 | Previously verified | SQL-test student explanation submission and atomic officer approval changing linked absence to Excused. |
| E02 | Previously verified | SQL-test privacy: submitting student/officer only; patron, Headmaster and Dean cannot read private explanations. |
| E03 | Previously verified | Verify rejected/repeated/stale reviews, duplicate requests and cross-student abuse; audit all decisions. |
| E04 | Not complete | Complete student/officer explanation screens in final portals with readable context and decision state. |
| E05 | Not complete | Add optional photo/PDF proof in private storage with type/size limits, retention and permission tests. |
| E06 | Not complete | Ensure private attachments never appear in public URLs, logs, exports or AI requests. |
| G06 | Previously verified | Connect personal named notebooks/notes/checklists to signed-in user ownership; no shared staff notebook. |
| G07 | Not complete | Verify notebook cross-account denial, reload/cross-device sync, conflicts and safe deletion. |

## Owner/school inputs (request only when dependent work is ready)

School source-file examples; approved public wording/claims; school year/term dates; school-owned account identity; authorised pilot participants and acceptance decisions; service/email/billing ownership where needed. Never request passwords in chat. No owner action is needed for this review; request school/device/source inputs only when the next authorised task depends on them.

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


### Final three-item session — 4 November 2026
H03: all three AI adapters now use a shared server policy. The server accepts bounded alternating user/assistant conversation text only, rejects browser-supplied system instructions/model/tools/record-context fields, has no database clients or action tools, deterministically refuses direct private-record requests and some obvious credentials without calling the provider, and returns only normalised assistant text. Frontend sends conversation text only and does not read school data/device stores. This does not detect every sensitive fact a user might type; the interface and Privacy page explicitly warn against pasting private information. H02 remains open for durable rate/cost controls.
H05: Enter/Shift+Enter/composition handling, open/close focus, Escape, stop, keyboard-readable transcript, completed-answer polite atomic announcement and reduced-motion immediate rendering verified with focused tests; actual deployed Enter/refusal, retained input focus, Escape/launcher focus and announcement DOM semantics were browser-checked. I03 retains human screen-reader/audio and complete device/contrast acceptance; no claim of an NVDA/VoiceOver certification.
H10: Privacy, Terms and Support now have real internal pages, consistent navigation, skip links and practical pilot guidance. Internal paths/anchors were checked; deployed Privacy → Terms → Support navigation and native disclosure keyboard operation passed. Final school privacy/retention/legal/support-contact approval remains J02/J11. Existing external school contact claims remain H09.
77 Node tests pass; syntax and whitespace checks pass. Preview commit 468ccd16e7063e3eb2bad671d4edabcfe27713e8 is READY. A normal learning question used local fallback because LDK_AI_API_KEY is configured only for production, not Preview (metadata checked without decrypting). This is not evidence of a provider outage; H01 remains open for a configured live-provider test. No secret scope or database change made.
Tracker: 48/128 checked, 80 open. Keep PR #10 draft/unmerged. No owner action needed tonight.


### Scope review session — 5 November 2026
Reviewed current GitHub main/draft PR #10, Vercel production/latest preview and live landing page, including a read-only desktop scroll attempt. Updated this tracker only. Twelve original notebook/explanation IDs are deferred; five affected completed active items are reopened. Current release accounting: 36 verified + 80 open + 12 deferred = 128 original tracked IDs. Historical work/evidence stays intact; no application feature or data changed. Implementation awaits a later instruction.


### First lightweight design increment — 5 November 2026
Reviewed the tracker again before implementation. Followed the existing scrolling/performance priority and kept attractive green identity rather than stripping useful design. Created an original 971-byte SVG helper in the existing chat launcher/header; retained the local book illustration. No extra widget/framework/library.
Removed the custom wheel override/animation loop, reveal observer dependency, pointer-following achievement-card tilt/glow, blurred hero decorations and backdrop blur. Reveal content is visible without waiting for JavaScript. Reduced section spacing and made the hero a compact desktop grid with an existing responsive single-column fallback. Added viewport-bounded modal scrolling; modal/phone acceptance remains open. Corrected the heading gradient for light-theme contrast.
Observed preview at 1348px width: native downward scrolling moved from 0 to 936px; no horizontal page overflow; hero height approximately 547px; zero canvases and zero visible backdrop-filter elements; book/helper images loaded. Existing chat open/focus still works. Both theme states checked; a light-theme heading improvement is included in the follow-up commit.
Raw script.js reduced from 125,028 to 120,599 bytes; style.css reduced by approximately 2.8 KB before the small contrast adjustment. Helper SVG is 971 bytes (456 bytes under local gzip). These are source-size observations, not measured transfer timing, CPU savings or a slow-network claim.
77 Node tests and syntax/whitespace checks pass. Remaining: real phone/tablet/keyboard and slow-network checks, removal of deferred feature entry points, concise chat behaviour and the rest of the scoped workflow. I01/I02/H09 stay open. Tracker unchanged: 36 verified + 80 open + 12 deferred. Keep PR #10 draft/unmerged.

### 7 November — ten agreed work items

Implemented the reduced-scope public page and real workspace navigation, removed deferred notebook and student absence forms without deleting data, filtered Today actions, shortened trusted AI defaults, revised help/requirements, removed generic/unverified promotional content, deferred chat loading, and checked responsive public/sign-in layouts. Added read-only own-student records and blocked direct new absence submissions in the database. No production merge or promotion.

87 Node tests pass. Extended daily_followup.sql rollback suite passed, including privacy, disabled-role denial, own-record isolation, missing-vs-zero results, blocked new submissions and retained officer corrections. Test accounts remaining: zero. Preview public/sign-in widths 320, 768 and 1280px have no horizontal overflow; narrow menu opens and Escape closes it; public → sign-in and Support → Privacy → Terms → Home work. Browser frames are CSS viewport evidence, not a physical-phone/keyboard trial. Source HTML reduced from 95,926 to 5,926 bytes; initial application script is public.js (2,110 bytes); chat loads on request. No measured slow-network speed claim.

Completed five existing IDs: A06, G01, G02, G10, H10. Current accounting: **41 verified + 75 open + 12 deferred = 128**. The ten work items are not ten automatically completed handover checks. D06/I01/I02/H01/H02/A08 remain open for real-role demonstration, device/network acceptance, configured AI response and durable limits, and release review. PR #10 remains draft; do not merge yet. PR #4 is superseded and PR #9 is deferred; keep their branches if closing unmerged.

### 7 November — visitor website, accounts and roster session

Tackled the next ten work items. Visitor homepage restored with separate School sign in; pending school facts are clearly unconfirmed, and the old-site content proposal is recorded for director review. Requirements now permit targeted removal of identified test notes/records. No wholesale data reset.

Added Headmaster staff directory, reviewed invitations, reviewed role/enabled changes and account setup/recovery page. A JWT-verified Edge Function keeps the Auth admin key on the server. Direct profile/role mutations are revoked; legacy broad admin authorisation is disabled. Current server role/session checks apply; disabling expires old sessions and re-enabling does not revive them. Browser UI polls current access every 30 seconds while visible. No real email/invitation was sent; email settings, callback allowlist, actual recovery/replay and signed-in staff UI acceptance remain B09/B10/B14.

CSV roster preview shows new/changed/unchanged and before/after fields. Atomic Headmaster apply revalidates the preview against current rows, locks classes, stores a request receipt and records row history. It preserves omitted students, blank existing status, scores, linked accounts and contacts; no invitations. Excel parsing, school format confirmation and one-use officer grants remain C07/C08/C10/C11.

100 Node tests pass. accounts_roster_handover.sql and daily_followup.sql rollback suites pass. Multi-identity SQL demonstrates teacher submission → officer visibility → correction/audit → corrected totals; this is not a two-device signed-in browser demonstration. No synthetic test accounts remain. Session tests include refresh/rejection UI, changed roles, disabled account, unknown/expired server sessions and non-revival after re-enable. Source migration history reconciled, including earlier scripts archived under history; isolated rebuild/recovery remains A07/I08.

Three technical checks completed: B04 (session/access tests), B12 (server role enforcement and broad admin loophole removal), C09 (omitted-field/score/account/invitation preservation on roster updates). **44 verified + 72 open + 12 deferred = 128**. Built features can still have pending acceptance steps. PR #10 stays draft; no merge/production promotion. Detailed task-by-task status: verification/ACCOUNTS_ROSTER_SESSION_2026-11-07.md.

Later in the same session: secure real Headmaster sign-in succeeded. Staff directory/ownership protection, Attendance navigation, live duplicate-ID and unknown-class CSV errors were checked, then signed out. Narrow recovery layout was 320px with no horizontal overflow; expired-link UI hides the password form and clears the fragment. No new school rows/accounts/emails were created. The database currently has no classes, so positive live import requires initial school setup. Final email gates keep invitation/reset requests disabled until the production callback exists and Auth mail/redirect acceptance passes. Edge v3 active; 101 Node tests pass. Tracker remains 44 verified / 72 open / 12 deferred. B09/B10/D06/D10/D17 and release gates remain open for their stated remaining acceptance.

### 7 November — ten academic/permission checks

Selected ten existing IDs: C10, C11, C13, F01, F02, F03, F04, F05, F07, F08. Eight technical outcomes verified and checked: C10/C13/F01/F03/F04/F05/F07/F08. C11 remains open because overlapping requests through the SQL connector were processed serially; same-permission reuse is denied and failures leave permission unused, but genuine parallel lock contention is not established. F02 remains open: the strict CSV template/parser works, but an approved school file example and format adaptation are still needed. Do not count these two as complete.

Dean-only named class releases now preserve subject maxima, blank/zero distinctions, supplied overall, calculated weighted total and publication-time ranks. Warnings require review or a recorded publish-anyway reason. Full-class validation, stale previews, request/source duplicate protection and direct-write guards are tested. Corrections create a new immutable version, retain the original year/cohort/ranks and notify Headmasters. Each academic notice opens its release; students receive only their own release rows. This is not automatic promotion or a mixed academic/discipline leaderboard.

Headmaster staff cards can allow/revoke one roster import within 24 hours for an active Discipline Officer. A successful import uses the grant; bad/stale files do not. Individual student additions remain independent. Stale competing roster changes are rejected and a newly reviewed correction preserves scores/account fields. Actual simultaneous grant consumption remains C11.

116 Node tests pass; academic_releases.sql, roster_permissions.sql, daily_followup.sql and accounts_roster_handover.sql pass with rolled-back fixtures. Temporary committed non-login race fixtures were removed; fixture account count returned zero. Eight new migrations applied; all 45 versions inventoried. Advisor retains only the pre-existing leaked-password-protection warning. Browser Headmaster sign-in and read-only Academic results route worked, with no upload form and no desktop overflow. No classes are configured, so this was an honest empty view, not a real published school-results demonstration. Small navigation/copy follow-up is covered by unit tests.

Tracker: **52 verified + 64 open + 12 deferred = 128**. PR #10 stays draft; no merge/production promotion. See verification/ACADEMIC_PERMISSIONS_SESSION_2026-11-07.md for evidence and limits. School format examples, actual Dean/student/two-device acceptance, email, physical-phone/keyboard/network and the remaining import/report/security/handover checks remain open.

Class refresh follow-up: results refresh reloads available classes; attendance navigation refreshes class choices and keeps an in-progress same-class register. Newly created classes no longer require repeated sign-in to appear. Focused tests prove class discovery and draft/mark preservation. Headmaster academic notices now also appear as unread Today tasks and open their exact release. All 116 Node tests pass; the eight-check accounting above is unchanged.

### 7 November — next ten without school-file dependency

C03/D18/F06/F09/F10/F11/F12/G08/G09/H09 completed technically. 134 Node tests and six rollback SQL suites pass. Official discipline import/correction/history, officer/no-reviewer permissions, Headmaster/fellow-officer notices/Today, separate filtered reports with CSV/native print, reviewed year changes and enrolment history are connected. Attendance checks roster again before saving and preserves remaining marks while requiring review after membership changes. Public copy/gaps shortened without removing the local art or green identity.

**62 verified + 54 open + 12 deferred = 128.** See verification/DISCIPLINE_REPORTS_SESSION_2026-11-07.md for outcome boundaries. Parsed source evidence/reference is retained; original file binaries and school-specific formats are not implemented. Native print DOM/actions verified; physical PDF/print and signed-in device acceptance remain I01/I03/I10. True concurrent independent-session proof remains C11/D16. History starts at the labelled baseline and never invents older enrolment dates. Six migrations applied; 51 source versions inventoried. Temporary test fixtures roll back; no real school data/account invitation was created. Production unchanged; PR #10 draft. Director's results file can arrive later; F02/C07 stay open.

### 7 November — class letters, manual review, public editors and release reconciliation

K02/K03/K04/K05/K06/F13/H11/B13/J07/A08 verified technically; 72 verified + 44 open + 12 deferred = 128. Code 4ac3181e2263b295f3bb0d61696a3ffe5b733ad8 in draft PR #10; READY preview reviewed for stationary stars/public layout and role guides. Class letters use recorded source snapshots, separate explanation, reviewed saves/versions, Headmaster notice/read and portrait print. Manual promote/repeat is one explicit human decision at a time; threshold only highlights review. Public school text is Headmaster/named-editor controlled, with review/audit and anonymous approved-text-only projection.

148 Node tests and the new integrated rollback suite pass. The earlier six suites retain recorded evidence; they were not all rerun in this session. 58 migration sources inventoried; no actual school data, public facts, editor grant, progression decision or email remains from testing. See verification/LETTERS_PUBLIC_REVIEW_SESSION_2026-11-07.md, RELEASE_PLAN.md, connected/guide.html and OPERATIONS_AND_HANDOVER.md. K01/K07 school usefulness, actual private-role/device/print and production handover acceptance remain open. PR #4 superseded/#9 deferred/#10 draft; do not merge separately or promote yet. No report card is required for these completed technical tasks; C07/F02 still await approved examples.


### Final student access and report-reference increment — 7 November 2026
Ten work items completed; three original checks technically closed: B05/B07/B08. **75 verified + 41 open + 12 deferred = 128**. These counts do not equate ten work items with ten master checks. Student ID login, one-time setup and audited reset codes are implemented with Edge/SQL tests. Positive real student/browser and device acceptance remain open. I05 remains open for the broader dependency/log/security review. The supplied screenshot informs a single-release results summary, not a fabricated official annual report; C07/F02 remain open. See verification/STUDENT_ACCESS_REPORT_SESSION_2026-11-07.md.


### Two final shared-device privacy fixes — 7 November 2026
Completed: remove temporary student/report/class-letter print copies on sign-out/access-clear and printing failures; clear unfinished account passwords and school codes on tab hiding, page exit and restored-page return. Three targeted tests added; 162 Node tests pass. These strengthen B04/I03/I05 without closing broader acceptance gates. Master count remains 75 verified / 41 open / 12 deferred. No new database change, real credentials, messages or production merge.


### Two slow-connection fixes — 7 November 2026
Roster validation discards a previous file's delayed read/preview after file selection changes or view disposal; old validation cannot expose an import confirmation. Academic printing discards delayed helper loads after class/release navigation and retains the student selected when Print was clicked. Three regression tests added; 165 Node tests pass. These strengthen C08/I02; full Excel/device acceptance remains open. Count unchanged: 75 verified / 41 open / 12 deferred.


### Security review completed — 7 November 2026
I05 technically verified: current source key/dependency/endpoints review, database RLS/grants/views/definer configuration, storage state, secret-free diagnostics and bounded recent-log scan. Removed anonymous legacy table grants and client maintenance privileges; new postgres-owned public tables require explicit grants. Public approved text remains readable. 61 migrations inventoried. New least_privilege rollback checks and student_access/class_letters_public_progression suites pass. Existing leaked-password warning remains tracked in B14; AI durable cost/rate protection H02, environment separation I04, monitoring I06 and release/real-device acceptance remain open. **76 verified + 40 open + 12 deferred = 128**. Details: verification/SECURITY_REVIEW_2026-11-07.md.


### Attendance and recovery verification, 10 November 2026

D06 is complete in the draft release. School sign-in opens the Staff or Admin workspace using account roles. Attendance runs from those workspaces without a student login. Teacher, patron, officer and student entry permissions are covered by the automated checks.

Ten scenarios were checked across UI handlers and the database. The batch fixes stale register responses after changing dates or views, preserves the new register when a reconnect check finishes late, and keeps a successful submission confirmed even if the overview fails to refresh. A database duplicate preserves the losing device's draft and hides confirmation. The same database scenario now verifies that an officer correction appears in the attendance report.

168 Node tests and four affected rollback database suites passed. The local Chromium runner could not start because the environment denied a socket operation. The actual offline browser trial, physical phone checks, independently concurrent submissions, two-device officer refresh and signed-in browser-to-report demonstration stay open under D07/D10/D16/D17/I01/I02/I09. Actual email delivery remains open. Draft PR #10 remains the review branch. **77 verified, 39 open, 12 postponed.** Evidence is in verification/ATTENDANCE_BATCH_2026-11-10.md.


### Nine handover items verified, 10 November 2026

Closed C11, D07, D10, D16, D17, I02, I03, I09 and I10. Signed-in Chromium tests used synthetic teacher and officer sessions at phone widths, interrupted attendance requests, reload, reconnect and a real correction-to-report flow. Independent database sessions verified one roster grant use and one complete register when requests overlapped. Rollback suites covered roster, results, announcements and one-time student access codes.

The connected entry now loads seven tools on demand and defers approximately 61% of its initial JavaScript bytes. The workspace has a keyboard skip link and a visible correction-reason label. The temporary pilot fixtures and race helpers were removed. **86 verified, 30 open, 12 postponed.** See verification/HANDOVER_NINE_2026-11-10.md for the evidence and test boundaries.


### Ten handover items verified, 10 November 2026

Closed A07, B14, C08, H01, H02, H04, I06, I08, J06 and J12. Independent application schema replay matched the pilot column fingerprint. The roster importer accepts the strict Excel template and existing CSV path. Chat gained bounded provider requests, approved public answers and privacy-safe support references. The previous draft deployment was restored and moved forward again without changing the production alias. A synthetic ownership transition retained the original actor history. The handover pack records access, costs, known limits and first-week checkpoints.

**96 verified, 20 open, 12 postponed.** See verification/HANDOVER_TEN_2026-11-10.md for the test evidence and scope of each closure. Actual school data, school ownership and sign-off, production email, physical-device and backup recovery gates remain open.

### 11 November — release-readiness work

Progress on B10/B06/B09/I01/I04/I07/J08/F02/I11/J09 is recorded in verification/HANDOVER_READINESS_2026-11-11.md. The draft now gates connected previews on a separate test database, handles confirmed password saves separately from sign-out failures, and adjusts the short-screen and mobile layout. Full acceptance requirements remain open. **96 verified, 20 open, 12 postponed.**


### 11 November — isolated school rehearsal and backup drill

Closed I04 and I07. The current PR #10 preview points to a separate Supabase project. Real hosted Auth sessions exercised synthetic attendance, officer correction, results publication and student setup. A fresh isolated restore matched all 29 application rows and retained role restrictions. The release bundle excludes the old demo code, and the account page now handles one-time Auth token-hash callbacks. The live deployment remains unchanged. See verification/ISOLATED_WORKSPACE_2026-11-11.md. **98 verified, 18 open, 12 postponed.**

### 11 November — review of all 18 remaining checks

Reviewed all open items and added student-facing discipline details, a worked discipline import example, and the revised student results printout. Recorded the Headmaster as designated owner and expanded the full staff trial route. See verification/REMAINING_HANDOVER_CHECKS_2026-11-11.md for each closure condition. **98 verified, 18 open, 12 postponed.**


### 12 November — LDK identity and public website research

The school is **Lycée de Kigali (LDK)**. **RUHUKA is the developer company**, not the school or the chatbot. This corrects earlier references to preserving RUHUKA public identity. The chatbot must be called **LDK’s AI assistant**; audit visible text, greetings, accessibility labels and server instructions, not just the button. Company credit belongs only in an agreed discreet footer/legal context; internal technical names need not be renamed indiscriminately.

Research and pending director choices are recorded in [LDK design research](verification/LDK_DESIGN_RESEARCH_2026-11-12.md). Sixteen institutional public sites were reviewed for content/navigation; visual browser spot checks supplemented this, not a complete all-site audit. Ten person-free art directions were generated for selection, not installed. Google share link resolves to ldkedu.com, distinct from the older lyceedekigali.ac.rw site; confirm their respective authority. The old official logo was located and inspected, but the current version and a clearer source still need confirmation.

Pending implementation/acceptance under H07/H09/H10 and I01/I11/J09:
- [ ] Choose an institutional visual direction: coherent school colours/type, fewer decorative cards, selective lightweight art, school-first header/logo, secondary sign-in.
- [ ] Approve researched history and sports stories; confirm current combinations, clubs, school contacts and logo before publishing.
- [ ] Replace public/workspace/chat school branding with LDK, keeping RUHUKA only in agreed developer attribution.
- [ ] Remove demo credentials and developer-only explanations from the production build when the corresponding demo paths are disabled; keep test banners on test previews and essential real saving/privacy/error disclosures.
- [ ] Confirm same-tab detail-page navigation versus earlier requested new tabs; then test every distinct visitor destination.
- [ ] Revalidate redesigned mobile/desktop layout, keyboard, contrast, asset loading and useful content before public release.

These are scoped acceptance subtasks, not six additional original IDs. **98 verified / 18 open / 12 postponed** remains the historical technical tally; research does not close any of the remaining checks or certify the proposed redesign. No new school facts, logo or artwork were published to production in this session.


### 13 November — approved LDK visitor redesign implemented

Director approved red/green school identity, supplied newcomer emblem, bolder book illustration, same-tab navigation and researched history/club content except the outdated combinations. Director supplies approximate 6,000+ alumni and confirms ldkedu.com is a student showcase project.

- [x] Built six consistent visitor pages with LDK identity, school crest, red/green accents, clearer book artwork and secondary member sign-in.
- [x] Removed outdated combinations; linked enquiries to the office rather than inventing a new programme list.
- [x] Added approved heritage/alumni and dated source-linked academic/sports milestones.
- [x] Updated public, chatbot, workspace title and report school branding; kept technical identifiers stable and discreet developer credit.
- [x] Implemented same-tab destinations, mobile menu, section/deep links and light-default theme with saved preference.
- [x] Passed 184 Node tests and browser fixture at 320/390/768/1280px; inspected screenshots and corrected the narrow motto row.
- [ ] Director review of final preview and clearer original crest if available.
- [ ] Complete remaining launch gates and developer/demo-copy cleanup before production release.

These are redesign subtasks, not new original IDs. **98 verified / 18 open / 12 postponed** remains the workflow tally. See verification/LDK_REDESIGN_2026-11-13.md for sources, files and verification limits. Production has not been merged or promoted.


### Visitor follow-up, 13 November 2026

- [x] Removed the crest from Ask LDK, kept it in the chat panel and made Close visible with theme contrast and keyboard focus return.
- [x] Removed the folded-paper art and unconfirmed current club list. Retained dated sports milestones and the existing book illustration. Added sticky history and contact content for larger screens.
- [x] Embedded the school’s existing Google Maps pin on Visit & contact with directions and lazy loading. Added the map connection to the privacy page.
- [ ] Confirm current School Life activities and select school-approved campus photography. Discuss the final placement of the book illustration, a Rwanda section and any leadership content with the director before publishing those items.

All 184 automated tests passed. Hosted Chromium checked the visitor pages at 320, 390, 768 and 1280 pixels, including chat dismissal, focus, sticky history and map markup. The third-party map itself was outside the isolated browser fixture. Handover tally remains 98 verified, 18 open and 12 postponed.

## Director testing preparation — 13 November 2026

- Production account state confirmed without reading or changing its password. No school records were imported.
- Production AI budget credential added to Vercel and matched against the database. Rollback probe accepted the configured key and rejected a wrong key without retaining a request counter. Provider response still needs verification on the production build.
- Added first-login setup instructions; replaced internal development milestones in sign-in/AI wording with practical account guidance. Disabled email paths remain honestly described.
- Added repeatable build/link/exclusion checks and a GitHub Actions workflow for the Node suite and release bundle.
- Photo/content decisions recorded in DIRECTOR_TESTING.md. No invented school activity, leader, annual marks formula or Rwanda section added.
- Remaining count is unchanged: 98 verified, 18 open, 12 deferred. Director testing is the next acceptance activity, not a reason to wait for school sign-off before reviewing the site.

## Director decisions and evidence plan — 14 November 2026

- The director will perform the first full role review, then invite additional staff. Keep the production Headmaster account intact. Use the same director email in the isolated project with one active test role at a time; retain identity/history rather than deleting/recreating it. Revoke sessions between role changes. A second independent account is needed later to prove simultaneous cross-portal behavior. Test account creation is blocked on Auth dashboard access, not completed.
- C07/F02: support a choice between the supplied template and a reviewed school format. Current code supports the template only (CSV/XLSX roster, CSV academics). A custom-format selection is not evidence of compatibility. Receive a redacted sample or exact column/worksheet specification, map fields explicitly, preview and apply through existing validators. Do not invent annual weighting.
- J11: RUHUKA will provide support initially, as confirmed by the director. Named contact, response window, backups and school ownership remain to be agreed at handover.
- J01/J02/J03/J09/K01/K07: add an existing-system and before/after workload check. Confirm whether LDK uses Karame/SDMS or another system; do not assume adoption or an available integration API. See verification/LDK_VALUE_REVIEW_2026-11-14.md and verification/pilot-measurements.csv.
- Public page: added a restrained Rwanda/Kigali section using existing location/history/alumni context, without school ranking or unverified achievement claims. Real photography waits for the Headmaster’s input.
- Tally unchanged: 98 verified, 18 open, 12 deferred. A developer/director review does not replace staff usability acceptance.
