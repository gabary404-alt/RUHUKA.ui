# Database and repository baseline — 7 November 2026

Active project: RUHUKA system (jsqiqxflgokfdooogcst). Production website remains on main; the database already includes pilot changes. Do not reset this project to make Git match it.

## Recorded migration history

All 58 applied versions are represented in MIGRATION_INVENTORY.json (path and SHA-256). The eight 12 October scripts depended on an earlier database structure; their exact recorded statements are retained under history/, not presented as a runnable fresh-database migration chain. The 20 October reset/schema script is recovered under migrations/ as the historical post-reset starting point. It includes destructive DROP statements and must never be manually rerun on the active project. Later files correspond to the applied additive migrations.

This reconciles recorded history and source files; it does not prove a clean-database rebuild. A07/I08 remain open until an isolated fresh-database replay/current schema comparison and recovery exercise are completed. Historical checksums represent the retrieved statement text with a trailing semicolon/newline, not a claim that formatting matches the original development machine.

## New account/import boundary

Headmaster staff management is an audited database operation. Direct authenticated profile/role writes are revoked. The legacy broad admin role no longer authorises school operations through has_school_role. Current active roles and a JWT session_id are checked against server sessions; disabling a staff account expires its existing sessions. The frontend rechecks access every 30 seconds while visible and on return to the page. Lost connectivity may leave already-rendered data visible; server permissions still apply to every new protected operation.

The staff-accounts Edge Function v3 verifies the user and Headmaster permission before using its server-owned Auth admin key. It sends invitations only on explicit in-app review/confirmation. No real invitation was sent during this development session. Existing-email invitations return a conflict rather than silently changing access. A partially created unassigned account appears in the Headmaster directory for explicit recovery. Passwords are set only by the recipient.

The invitation callback currently points to production /connected/account.html, which must be deployed and allowlisted before staff invitation acceptance. Reset links use the current account page origin, which also must be on the Auth redirect allowlist. Email delivery, expiry/replay behaviour through actual email and approved production/preview redirects remain B09/B14 acceptance work. No SMTP credentials, Auth configuration or paid service was silently changed.

Roster imports: Headmaster or an officer with a current one-use grant, CSV up to 500 KB / 1000 rows; school-specific Excel parsing remains open. Preview contains new/changed/unchanged totals and before/after fields. Atomic apply revalidates the server roster and class locks, rejects stale previews, records row changes and uses an actor-bound request receipt for safe retries. Omitted students, blank status on existing students, scores, linked accounts and contact fields are preserved. Imports do not invite accounts.

## Test-data decision

The director confirmed existing notes and old school records were development tests and need not be retained. No blanket deletion is implemented in an application migration. Before first school import, prepare a targeted cleanup inventory of actual test entities/dependencies, retain the working director account/security/schema, remove test records using the agreed scope, and verify empty/expected totals. Device-only data can exist in browsers outside this session. No claim is made that remote browser notes were erased.

PR #4 is superseded, #9 is deferred and #10 remains the integration draft. No merge/production promotion is authorised by this document.

Invitations are gated off by default on both client configuration and server environment RUHUKA_STAFF_INVITES_ENABLED. Email reset requests are gated by emailRecoveryEnabled=false. Enable only after production account.html deployment, Auth redirect allowlisting and an agreed actual-email acceptance test. Supabase Edge built-in service credentials are never copied into client configuration. Secure Headmaster sign-in/sign-out and real negative roster checks passed in this session; no live school data was added.

## Academic release and officer-permission increment

Eight new migration versions implement immutable public-schema release/result tables with RLS and no direct client table grants, Dean-guarded preview/publication, role-checked read RPCs, student-own results and current-year follow-up sources. Legacy direct academic-record writes and client academic-batch mutations are blocked. New publications use trusted transactional code and preserve source payload fingerprints, warnings/reasons, author and previous-version references. This does not implement complete raw-file evidence storage or school-specific Excel mapping.

Officer roster grants are private RPC-only rows with Headmaster issuer, fixed roster_import operation, expiry, consumption receipt and revocation. The import takes a row lock and uses permission only after success in the same transaction. Failed/stale operations roll back. Concurrent requests via the current SQL connector were serialised; independent concurrent-session proof remains open. Temporary race fixtures were cleaned, not left as staff accounts. See verification/ACADEMIC_PERMISSIONS_SESSION_2026-11-07.md.

## Official discipline, report and enrolment increment

Six additive versions follow the academic/permission increment. Officer-only preview/apply retains canonical official totals, optional dated source evidence, reference/filenames/fingerprints, original cohort/year, author and immutable correction versions. Raw discipline writes and legacy apply/staging are blocked; the old separate-review constraint is removed. Official snapshot trigger guards remain. Totals-only corrections preserve omitted events. Current readers/concerns exclude superseded versions and old-year/class sources where appropriate; older corrections cannot overwrite a newer cached snapshot. Headmaster and fellow officers receive notices and Today tasks.

Read-only report RPCs enforce roles/class/date/release and return only whitelisted fields. CSV/native print use one loaded snapshot; source IDs and version remain visible. No assumption of expected school days or mixed ranking. Append-only private enrolment history has explicit deny RLS/no client grants and limited administrator read RPC; baseline does not invent older dates. Headmaster year changes check expected year and record reason; no automatic promotion.

134 Node tests and six rollback suites pass. Actual browser role/device, physical print/PDF/Excel locale and genuine parallel-session acceptance remain open. Source examples pending. See verification/DISCIPLINE_REPORTS_SESSION_2026-11-07.md.

## Class letter, manual review and public projection increment

Seven additive versions implement private RPC-only letter snapshots and explicit human progression policy/decisions, audited named public editors and public content versions. Letter sources whitelist main status aggregates, academic aggregates and official discipline evidence; private reasons/contacts/medical evidence are not copied. Letter save uses server-built source hash and locks, immutable parent/version, actor/request retry and Headmaster notice. Later changes flag saved snapshots rather than replacing them. Manual review retains before/destination/year/results/policy/reason, rejects stale decisions and supports linked correction; no automatic promotion.

Anonymous public text comes from a dedicated SELECT-only public table with RLS, not private-schema usage; editor/state/version tables remain private, explicitly denied and RPC checked. Revoking disabled editors is supported. Canonical review year prevents whitespace duplicate roots. All 58 applied versions are inventoried. Security advisor remains the existing leaked-password warning only. 148 Node tests and the new integrated rollback suite pass; earlier six suite evidence retained. See verification/LETTERS_PUBLIC_REVIEW_SESSION_2026-11-07.md.
