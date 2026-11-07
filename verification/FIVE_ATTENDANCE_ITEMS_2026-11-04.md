# Five attendance items — 4 November 2026

Completed technical implementation/verification: D08, D09, D11, D15, E03. All changes are in the connected pilot, not the historical demo routes.

- D08: explicit totals review then confirmation; server save only on second confirmed action. Four statuses stay distinct; malformed marks rejected. Integration test covers review-before-write and successful submission. Existing RPC unique rejection covers concurrent submission protection.
- D09: overview v2 returns submitter name (narrow authorised lookup), UUID/time and count of records corrected based on audit events. Missing classes remain missing. SQL fixture verifies display name and corrected count; UI test verifies render. No private profile/email returned.
- D11: server existence check before submission and on online event. Existing register causes local draft to remain unsubmitted and preserved, with blocked submission view. Mocked online-event test verifies no upload; live cross-device/race acceptance remains D16/D17/I02.
- D15: officer history UI includes before/after, reason, timestamp and actor UUID. Database tests cover officer audit visibility, student denial and direct-forgery denial. Sensitive workflow review decisions restricted, including Headmaster audit views. UI rendering test verifies actual history fields. Submitter names are human-readable; correction actors remain UUID until scoped display-name design is extended.
- E03: rejection leaves attendance absent and records decision; repeat decision rejected; duplicate pending request rejected; changed-to-present mark blocks stale approval without losing pending item; another student cannot explain target record. All executed in rollback transaction.

Verification: 43 Node tests pass, JavaScript syntax/whitespace checks pass, extended SQL integration transaction passed. No synthetic fixtures should remain; checked separately. Existing security advisor warning: leaked-password protection disabled.

Open acceptance: real phone/tablet browsers, visible multi-account workflows, simultaneous connections, full error/reconnect browser exercises. Keep PR draft.
