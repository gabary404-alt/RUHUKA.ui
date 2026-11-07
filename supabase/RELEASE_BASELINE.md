# Database and repository baseline — 7 November 2026

Active project: RUHUKA system (jsqiqxflgokfdooogcst). Production website remains on main; the database already includes pilot changes. Do not reset this project to make Git match it.

## Recorded migration history

All 37 applied versions are represented in MIGRATION_INVENTORY.json (path and SHA-256). The eight 12 October scripts depended on an earlier database structure; their exact recorded statements are retained under history/, not presented as a runnable fresh-database migration chain. The 20 October reset/schema script is recovered under migrations/ as the historical post-reset starting point. It includes destructive DROP statements and must never be manually rerun on the active project. Later files correspond to the applied additive migrations.

This reconciles recorded history and source files; it does not prove a clean-database rebuild. A07/I08 remain open until an isolated fresh-database replay/current schema comparison and recovery exercise are completed. Historical checksums represent the retrieved statement text with a trailing semicolon/newline, not a claim that formatting matches the original development machine.

## New account/import boundary

Headmaster staff management is an audited database operation. Direct authenticated profile/role writes are revoked. The legacy broad admin role no longer authorises school operations through has_school_role. Current active roles and a JWT session_id are checked against server sessions; disabling a staff account expires its existing sessions. The frontend rechecks access every 30 seconds while visible and on return to the page. Lost connectivity may leave already-rendered data visible; server permissions still apply to every new protected operation.

The staff-accounts Edge Function verifies the user and Headmaster permission before using its server-owned Auth admin key. It sends invitations only on explicit in-app review/confirmation. No real invitation was sent during this development session. Existing-email invitations return a conflict rather than silently changing access. A partially created unassigned account appears in the Headmaster directory for explicit recovery. Passwords are set only by the recipient.

The invitation callback currently points to production /connected/account.html, which must be deployed and allowlisted before staff invitation acceptance. Reset links use the current account page origin, which also must be on the Auth redirect allowlist. Email delivery, expiry/replay behaviour through actual email and approved production/preview redirects remain B09/B14 acceptance work. No SMTP credentials, Auth configuration or paid service was silently changed.

Roster imports: Headmaster only, CSV up to 500 KB / 1000 rows; school-specific Excel parsing and officer one-use grants remain open. Preview contains new/changed/unchanged totals and before/after fields. Atomic apply revalidates the server roster and class locks, rejects stale previews, records row changes and uses an actor-bound request receipt for safe retries. Omitted students, blank status on existing students, scores, linked accounts and contact fields are preserved. Imports do not invite accounts.

## Test-data decision

The director confirmed existing notes and old school records were development tests and need not be retained. No blanket deletion is implemented in an application migration. Before first school import, prepare a targeted cleanup inventory of actual test entities/dependencies, retain the working director account/security/schema, remove test records using the agreed scope, and verify empty/expected totals. Device-only data can exist in browsers outside this session. No claim is made that remote browser notes were erased.

PR #4 is superseded, #9 is deferred and #10 remains the integration draft. No merge/production promotion is authorised by this document.
