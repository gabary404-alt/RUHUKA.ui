# Connected attendance preview

Open /connected/ on the PR deployment. This is a separate pilot screen; existing portals remain demo. It uses RUHUKA system through the publishable key and a real user's short-lived access token held in memory. No role picker, signup, shared password, privileged key or demo fallback. Reload requires signing in again. In-page access tokens renew using an in-memory refresh token; failed renewal returns to sign-in. Account recovery is still pending.

Implemented: email/password login; active profile and database role checks; permitted class roster; explicit student marks; transactional main submission; duplicate warning; class/date coverage; register display; officer correction reason; five-second visible-page polling; manual refresh; signout. Polling is not realtime push.

Checks: 3 mocked authentication tests pass (invalid credentials; denied student/nonstaff account; officer route/overview). Existing 17 regression tests pass. Database rollback tests are separate. Browser/mobile/authenticated two-user end-to-end verification is pending.

Blocking pilot setup: no active profiles or role assignments currently exist. Owner must identify the initial staff account; do not guess an account or assign privilege from its existence. School roster is also empty. Bootstrap pilot accounts and synthetic records with owner-approved identities, then verify in real sessions. Never load actual student records into demo portals.

Not school-ready: account recovery, complete offline/reconnect handling, audit display, submitter display names, superseded request cancellation and complete integration into existing portal navigation remain. Preserve the dedicated preview until verified.

## Device drafts and session renewal

Attendance marks are saved under the signed-in user ID, class and date. Drafts remain Not submitted until the database operation succeeds, and are then removed. Storage failure is visible; corrupt draft data is not overwritten. Drafts restore when opening the same class after signing back in; they do not sync across devices. On shared devices local drafts are not encrypted and local storage is not a security boundary.

Focused tests cover user/class/date draft isolation, adapter reload persistence, matching-draft deletion, quota/read failures, corrupt data preservation, successful token renewal/retry and rejected renewal. Browser reload/phone keyboard and live authenticated cross-device verification remain pending. No refresh or access tokens are persisted in local storage.
