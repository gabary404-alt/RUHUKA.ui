# Ten academic and import-permission checks — 7 November 2026

Initial code: 5c8ab5aee5da3e9cbdd2708b369807828ac250e6, draft PR #10. A follow-up includes notice navigation, clearer empty states, fresh class choices and these delivery notes. Production website remains unchanged.

| Original check | Outcome | Evidence / boundary |
| --- | --- | --- |
| C10 | Complete technically | Headmaster can allow/revoke one roster import within 24 hours for an active officer. Server permission and staff-card confirmation tested. Successful import consumes it; validation does not. |
| C11 | Open | Same-use/retry/failed-validation cases pass. Overlapping tool requests were serialised, so genuine concurrent grant consumption is not established. |
| C13 | Complete technically | Duplicate IDs rejected; competing stale editor state is reproduced, blocked without partial changes, then safely corrected after a new preview. Scores/identity fields survive. Independent simultaneous connection testing remains C11. |
| F01 | Complete technically | Named, dated class releases retain publication ranks, author, original cohort/year and immutable earlier versions. |
| F02 | Open | Pilot CSV parser supports subject/max headers and supplied overall last. Approved actual school files/Excel mapping still required. |
| F03 | Complete technically | Blank versus zero, unequal maxima, incomplete calculated total and supplied/calculated mismatch warnings tested on client and server. |
| F04 | Complete technically | Dean reviews/fixes CSV or publishes with recorded warning reason. No separate Headmaster approval. |
| F05 | Complete technically | Supplied totals rank even with blank subjects; missing overall gets no rank. SQL proves 1,2,2,4 tie ordering and actual zero. |
| F07 | Complete technically | Dean publishes/corrects; previous version remains. Headmaster gets a recorded notice and Today task; notice opens the release. Publisher identity is shown. |
| F08 | Complete technically | Complete class validation, strict fields/ranges, duplicate IDs, stale/tampered previews, atomic publication, request/source duplicate protection and direct-write guards tested. |

**Accounting: 52 active verified + 64 active open + 12 deferred = 128. Eight checks completed; two are not counted.** Technical completion does not replace remaining school/device/role acceptance.

## Built workflow

The Dean chooses class, result date and a free release name, then uploads a CSV. The first column is student_id, each subject header gives its maximum (for example Mathematics/40), and overall_percent is last. Include every active class student exactly once; unavailable marks/overall are blank. This is the current strict pilot template, not a claim that every school spreadsheet is understood.

Preview comes from server validation. Weighted subject percentage is computed only when subject marks are complete; it never silently turns blanks into zero. Supplied overall determines rank. Missing overall remains Not recorded and unranked. Discrepancy tolerance is 0.01 percentage points. Warnings require a review or an explicit publish-anyway reason. All warnings remain stored; the interface reveals more warnings on demand rather than creating a huge initial list.

Corrections create a new release linked to its previous version. They use the original class/year cohort even after students move/leave or the class year changes. The original release and ranks remain unchanged. Current staff view hides inactive/moved students by default, with an original-cohort option. Student accounts receive only their own rows. Academic results stay separate from official discipline data and promotion decisions.

Headmaster notification is not approval. An unread publication/correction also appears on Today and its notice has a direct result link. Teachers read assigned classes; Headmaster reads school releases; only the Dean publishes. Direct client mutation of old academic records and academic import-batch state is blocked alongside protected new release tables.

Roster import permission is action-specific, beneficiary-specific, expires within 24 hours, and is consumed by one successful import in the same transaction. An uncertain response can retry the original actor/request/payload after consumption. Headmaster can revoke unused permission. Officer single-student additions stay independent.

## Verification

- **116 Node tests pass**, including parsing, warning confirmation, invalidated/late previews, read-only Headmaster/teacher UI, student-only rows, one-use permission confirmation, direct notice destination, fresh class discovery and draft preservation during class refresh.
- **academic_releases.sql**, **roster_permissions.sql**, **daily_followup.sql**, **accounts_roster_handover.sql** pass. Fixtures roll back. Academic tests include malformed/partial/duplicate/out-of-range requests, missing/zero/weighted totals, ties, override, duplicate source/request, immutable correction/year/cohort, role denials, own-result privacy, notice/Today state and legacy write bypass denial.
- Two temporary non-login race fixtures were deliberately committed for attempted independent-transaction testing and then removed with the narrowly scoped cleanup script. No real owner/staff account was changed. Fixture account count across prefixes 130–170 returned zero. No school results, actual class roster, invitation or email was left by testing.
- First attempted overlap held a grant lock for 3 seconds; outcomes applied / permission_denied, but the second operation itself waited only about 4.8 ms. A 10-second hold repeated this, with about 5.5 ms second-operation time and completion after the first transaction. The connector serialised requests. These results establish sequential non-reuse, not a simultaneous-lock test. **C11 stays open.** A future isolated test needs genuinely independent database connections.
- Eight migrations applied; **45 applied versions** are inventoried with source checksums. Security advisor retains only the pre-existing leaked-password-protection warning: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . No dependency/library or paid service was added.
- Browser at code 5c8ab5…: secure Headmaster sign-in succeeded; Academic results route was read-only (zero upload forms), no desktop horizontal overflow, honest empty-class view. There are no configured school classes. This does not establish a positive real Dean publication, student-device view or physical-phone keyboard acceptance. The final small class-refresh/notice/copy changes also have focused unit/SQL checks.

## Remaining work

C11 actual concurrency; F02 approved school-file mapping; actual Dean/student/teacher walkthrough, physical-phone/keyboard/slow-network acceptance; complete official discipline imports, reports/exports, account/email setup, school-owned handover and approval. Email invitation/reset gates remain off. Notebook/online absence submissions stay postponed. PR #10 remains draft and unmerged.
