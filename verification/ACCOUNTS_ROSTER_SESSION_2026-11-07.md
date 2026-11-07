# Visitor website, accounts and roster session — 7 November 2026

Initial code commit: 891d5354ae4387c9a88df1ed4ec75513815e7938 (PR #10). Follow-up includes documentation, a recovery hash-navigation fix, extra rollback assertions and narrow recovery layout frame. Production website remains unchanged.

| Agreed task | Work completed | Acceptance still needed |
| --- | --- | --- |
| 1. Visitor homepage | Our school / School life / Contact navigation, visitor-first hero and separate school sign-in. Local SVGs, no heavy startup modules. | Confirm real school text/photos/details before public release. |
| 2. School content proposal | Old-site combinations, clubs, contacts and staff claims inventoried in SCHOOL_CONTENT_PROPOSALS.md; none silently published as current fact. | Director/school approval. |
| 3. Checklist/test-data decision | Requirements and handoff updated; identified old records are disposable tests. | Targeted pre-import cleanup, not a project reset. No blanket deletion claimed. |
| 4. Repository/database reconciliation | All 37 applied versions represented with checksums. Eight pre-reset scripts archived separately; missing 20/27 October statements recovered. | Isolated rebuild/schema comparison and recovery drill; A07/I08 remain open. |
| 5. Staff accounts | Headmaster-only directory, review/confirm invitation, role/enabled changes, protected Headmaster accounts, audited server changes; JWT-verified Edge Function deployed. | Actual email invitation and signed-in Headmaster UI walkthrough; B10 remains open. |
| 6. Recovery and sessions | Setup/reset page, verified email identity before password entry, no tokens persisted, URL-fragment removal, generic recovery response; role/session polling, disable/expiry/renewal checks. | Actual email delivery, Auth redirect allowlist and real expiry/replay acceptance; B09/B14 remain open. |
| 7. Shared attendance demonstration | Multi-identity SQL: teacher submission, officer overview/name, correction, audit, corrected summary; duplicate denied. | Two signed-in sessions/devices; no claim this SQL run is a browser trial. |
| 8. Draft/retry checks | Existing scoped draft/blocked-storage/reconnect/duplicate tests retained; storage accessor no longer crashes page startup if storage access throws; stale register-load protection added. | Actual browser reload/offline/slow-network attendance trial; D10/D16/D17/I01/I02 remain open. |
| 9. Roster upload workflow | CSV template/parser, whole-file errors, server preview with before/after, atomic apply, stale preview rejection, stable request receipt for retries. Existing scores/account links/status/omitted students preserved; no invitations. | Real school file, Excel format support and officer one-use grants; C07/C08/C10/C11 remain open. |
| 10. Checks and release review | 100 Node tests and accounts_roster_handover.sql / daily_followup.sql rollback suites pass; zero synthetic accounts remain. READY preview public and recovery pages reviewed. | Signed-in walkthrough, actual email and release acceptance. PR stays draft. |

## Database/permission evidence

- Migrations 20261107101838, 20261107102136, 20261107102255 and 20261107102330 applied to RUHUKA system.
- Staff Edge Function version 2 active, verify_jwt=true. Only the Auth invite call uses the server-owned admin key; directory/lookup/role-save use the original user bearer so Headmaster rights are rechecked. Tests reject unauthenticated/non-Headmaster, injected roles and duplicate-email invites. No real invitation/email was sent.
- Direct profile/role writes are revoked. The old broad admin role no longer grants school access through the shared helper. Headmaster accounts cannot be disabled/reassigned through ordinary staff management; student accounts cannot be silently converted.
- Disabled accounts expire existing server sessions. A synthetic session stayed denied after re-enable; unknown session IDs and inactive/changed roles are denied. Client clears visible workspace on server access change; existing drafts remain until deliberately submitted/removed.
- Roster preview does not write. Invalid, duplicate or stale data rejects the batch. Same actor/request/payload replay returns the original receipt. Scores and linked identity survive an update with blank status; omitted students are not removed.
- Both SQL suites rollback every fixture. Fixture account count for the 130/140 prefixes was zero after execution. No actual owner account/profile was changed.
- Security advisor after changes has only the pre-existing leaked-password-protection warning; the private receipt table has explicit deny policies and no client grants.

## Browser evidence and limits

At code preview: public/sign-in at 320 CSS px and public 768/1280 frames had scrollWidth equal to clientWidth (305/320/753/1265 including scrollbars). Phone menu opened and Escape closed. Public Explore our school anchor scrolled to about at desktop; zero canvases and only public.js as application startup script. Recovery page renders with account-email label and clear delivery caveat. No live reset was requested. These are browser/CSS-frame observations, not physical-phone keyboard, touch, actual email or real-role workflow acceptance.

The page initially tested with a fragment-only same-document navigation did not rerun account initialization; a hashchange reload handler was added for that case. Unit verification still passes. Do not count recovery replay/expiry as accepted merely because a synthetic expired-link message can render.

## Tracker

Three technical checks completed: B04, B12, C09. Current 128-ID accounting: **44 active verified + 72 active open + 12 deferred**. Test count is not a handover percentage. No merge or production promotion yet. Next blocker for real signed-in browser acceptance is the director's secure email/password sign-in; never request or display that password in chat.
