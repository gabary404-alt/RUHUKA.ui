# Connected attendance preview

Open /connected/ on the PR deployment. This is a separate pilot screen; existing portals remain demo. It uses RUHUKA system through the publishable key and a real user's short-lived access token held in memory. No role picker, signup, shared password, privileged key or demo fallback. Reload requires signing in again. In-page access tokens renew using an in-memory refresh token; failed renewal returns to sign-in. Account recovery is still pending.

Implemented: email/password login; active profile and database role checks; permitted class roster; explicit student marks; transactional main submission; duplicate warning; class/date coverage; register display; officer correction reason; five-second visible-page polling; manual refresh; signout. Polling is not realtime push.

Checks: 3 mocked authentication tests pass (invalid credentials; denied student/nonstaff account; officer route/overview). Existing 17 regression tests pass. Database rollback tests are separate. Browser/mobile/authenticated two-user end-to-end verification is pending.

Blocking pilot setup: no active profiles or role assignments currently exist. Owner must identify the initial staff account; do not guess an account or assign privilege from its existence. School roster is also empty. Bootstrap pilot accounts and synthetic records with owner-approved identities, then verify in real sessions. Never load actual student records into demo portals.

Not school-ready: account recovery, complete offline/reconnect handling, audit display, submitter display names, superseded request cancellation and complete integration into existing portal navigation remain. Preserve the dedicated preview until verified.

## Device drafts and session renewal

Attendance marks are saved under the signed-in user ID, class and date. Drafts remain Not submitted until the database operation succeeds, and are then removed. Storage failure is visible; corrupt draft data is not overwritten. Drafts restore when opening the same class after signing back in; they do not sync across devices. On shared devices local drafts are not encrypted and local storage is not a security boundary.

Focused tests cover user/class/date draft isolation, adapter reload persistence, matching-draft deletion, quota/read failures, corrupt data preservation, successful token renewal/retry and rejected renewal. Browser reload/phone keyboard and live authenticated cross-device verification remain pending. No refresh or access tokens are persisted in local storage.


## Today and student follow-ups (4 November)
Today opens automatically after sign-in. Role-filtered tasks open the existing pilot attendance, explanations, roster and notice screens. Upload issues currently open read-only source/status details; import correction/application is not complete.
Attendance/academic/discipline concerns persist separately with source references, revision-checked human review and scoped review history. Attendance needs five consecutive recorded submitted main marks; unknown/missing marks are not absences. A return stops the streak but does not close an open case. A closed case reopens only after a new main absence without a return.
Academic concerns currently use the latest applied subject batch, weighted by maximum marks; final named-release/supplied-overall and expected-subject completeness integration remain pending. Discipline uses only the latest applied official snapshot. Cached demo scores are never a source.
Task counts poll every five seconds while visible. Concern scans run on opening/refresh and approximately every 30 seconds while visible. This is polling, not background delivery.
New migrations are 20261104191012, 20261104191148 and 20261104191913. See verification/TEN_FOLLOWUP_ITEMS_2026-11-04.md and supabase/tests/daily_followup.sql. Actual signed-in Today browser and phone/cross-device acceptance remain outstanding.
