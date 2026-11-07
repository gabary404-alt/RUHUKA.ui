# Final ten work items — 7 November 2026

Completed implementation work:
1. Reviewed the report screenshot; recorded only nonpersonal structure and unreadable/rule limitations.
2. Added Student ID/password sign-in alongside staff email sign-in, without a public ID-to-email lookup.
3. Added one-time school setup codes and student-chosen passwords.
4. Added audited officer/Headmaster reset codes and high-priority Headmaster notices for officer issuance.
5. Added Headmaster-only student enable/disable; code/session invalidation and no staff-account reset through student codes.
6. Added durable per-identifier/global limits, expiry/replay checks and honest partial-failure handling.
7. Added a lightweight single-release student results print layout, inspired by the reference rather than claiming official annual equivalence.
8. Connected the print action to student-own results and the existing authorised class results view.
9. Narrowed preview CORS on account handlers and checked service RPC grants/security advisory metadata.
10. Updated role guides, operational instructions, migration inventory and master checklist.

Evidence: 159 Node tests pass, including nine Edge-handler tests with mocked Auth calls and two results-print tests. student_access.sql rollback suite passed: issuance permissions, hashing/history, client denial of service-only operations, expiry/replay, linked identity/role guards, enable/disable, rate limit and synthetic completion. No actual school student/password/email was created or sent. SQL fixture identifiers are synthetic; transaction rolls back. Earlier seven SQL suite evidence is retained, not claimed rerun in this increment.

Applied migrations: 20261107191305 and 20261107191907. All 60 versions inventoried. Edge student-access v1 and staff-accounts v4 deployed. Public authentication handler uses its own credential checks (verify_jwt false); administrative handler retains verify_jwt true and explicit Headmaster checks. Invitation and email-reset gates remain off.

Service RPCs student_login_target/student_access_rate/student_code_consume/student_code_finish have no anon/authenticated execute permission. Public results view remains security_invoker. No Storage buckets exist. Security advisor reports the existing leaked-password-protection warning only; no new database advisory. I05 remains open: this bounded check does not complete dependency, logs and full release security acceptance.

Limitations: Auth password update and Postgres completion are not an atomic distributed transaction. The response explicitly reports an uncertain partial outcome; reissue is guarded for five minutes after consumption. Positive real student/browser setup, reset and sign-in remains school acceptance work. Physical phone/tablet/keyboard/native print/slow-network acceptance remains open. No official annual aggregation, grading scale, QR, signature or logo is invented from the low-resolution screenshot. A readable school PDF and import source are still required for C07/F02. Rank remains the saved release rank; academic and discipline scores remain separate.

Count: B05/B07/B08 technically complete. 75 verified + 41 open + 12 deferred = 128. Ten work items are not ten newly closed master IDs. PR #10 stays draft; #4 superseded, #9 deferred. No production promotion/merge. Preview and production use the same pilot Supabase project: I04 remains open.

Git code increment a3242b27a3d42914bc15de9550a828f2faf27495 produced READY preview dpl_6SLEFNqV48phszfzUYKMqeuU7rKm. Its account page was reviewed in the actual browser: school-code form visible, expiry explanation present, email recovery disabled, no credentials entered. The following small layout refinement puts student setup before unavailable email recovery. This is page-render evidence, not a successful student-account trial.
