# Reviewed first-handover integration plan — 7 November 2026

This records A08's source/scope reconciliation and reviewable release increment. It does not authorise a production merge or close account/device/school acceptance gates.

| Pull request | Observed source | Decision |
| --- | --- | --- |
| #4 Add Ruhuka backend database migrations | codex/backend-db-foundation-20261026, head bebe4a81e8a5f435c9498bbb7f918ae8c993d75f; open/draft, main target | Superseded. Its already-applied foundations are represented in the integration migration inventory. Do not separately reintroduce its earlier review/admin assumptions. Branch/history retained. |
| #9 Add named notebooks without replacing existing notes | codex/notebook-collections, head 77d27f30ae8f20f8da9193d5c835b4c05f99c6ab; open/draft, main target | Deferred. Notebook entry points are outside first handover. Leave unmerged; retain history for later. |
| #10 School workflow integration | codex/backend-attendance-guards, code 4ac3181e2263b295f3bb0d61696a3ffe5b733ad8; open/draft, main 82bc3a2a39b6ed490a8b72097518721918e46a33 | Current review increment. No Git merge conflict reported. Includes visitor page, protected school workflows and additive source migrations; keep draft until remaining release gates pass. |

## Reviewed increment

Existing lightweight public page, native scroll and lazy AI; role-derived school workspace; atomic main/follow-up attendance, correction history, drafts/reconnect, Today/concerns, roster/calendar/assignments, in-app notices and announcements; named academic releases, official discipline imports, separate reports/CSV/native print, enrolment history and one-use roster permissions.

This increment adds reviewed shared class letters with immutable source snapshots/versions, separate author wording, official evidence appendix and Headmaster notice/read access. Manual promote/repeat review records one explicit human decision at a time with source/policy/previous class/reason/history and corrections. Public editing is Headmaster/named staff only, audited and school-approval-confirmed; anonymous readers see only a read-only approved-text projection. Role guides describe real controls and currently unavailable account recovery honestly.

Notebook and online student absence-submission entry points remain absent. Their historical schema/code is not activated by a UI shortcut. Existing private history is not reset. Parent messaging, SMS, automatic promotion, school-wide leaderboards and elaborate interactive 3D stay deferred. The user's new stationary stars are six CSS gradient points on the public hero, with no timer/canvas/animation; the book/helper identity remains.

## Evidence and release gates

148 Node tests pass at code increment. New rollback SQL suite verifies letters/snapshots/privacy, official source separation, explicit human decisions/corrections, role denials, editor grant/revoke/stale publishing and anonymous public projection. Earlier six suites retain evidence for attendance/academic/import/role boundaries. See verification/LETTERS_PUBLIC_REVIEW_SESSION_2026-11-07.md for exact current verification and limitations.

All 60 applied migration versions are inventoried with source checksums. This is source/history reconciliation, not proof of a clean rebuild; A07/I07/I08 remain open. Historical destructive reset/schema statements are not a fresh-install instruction and must never be rerun on the live project.

Before a merge recommendation: actual signed-in teacher/patron → officer → report trial, role/student/account setup and recovery, physical phone/tablet/keyboard/print/slow-network checks, school-file adaptation, AI provider/cost controls and the remaining security/operations acceptance. Email invitation/reset flags stay off. Never merge #4/#9 along with #10 as a shortcut. No current production files or service ownership were changed by this review.

A later release decision must name the reviewed commit and deployment, check the current schema/migration state and acceptance evidence, and have the director/school approval required by J10. Closing an obsolete PR can be done later without deleting its branch/history.


Latest increment: student ID/password entry, private one-time setup/reset codes, Headmaster student enable/disable, officer issuance notices, durable rate limits and single-release student results print. 159 Node tests and student_access rollback SQL pass. The screenshot is retained only as a visual reference, never copied as personal demo data. Positive real student acceptance and official annual-report rules remain release gates. Current tracker: 75 verified / 41 open / 12 deferred.
