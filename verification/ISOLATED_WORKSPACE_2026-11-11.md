# Isolated school rehearsal and recovery drill — 11 November 2026

## Completed checks

**I04.** The protected PR #10 preview serves browser configuration for the separate Supabase project RUHUKA isolated test. Its dedicated database started empty and rebuilt 322 application columns. The application functions match the checked migration baseline except for the absent legacy platform helper. The student-access and staff-accounts Edge Functions were deployed on the test project. The preview chatbot uses the same isolated public-information projection and cannot call the paid provider. The browser shows a Test workspace banner. Earlier immutable previews are excluded from the rehearsal procedure.

Four independent Auth sessions exercised real hosted role checks. A teacher submitted a class register, a duplicate failed, an officer corrected an absence to Late, and the teacher was forbidden from making the correction. The Dean published a release containing a zero and a blank, with a retained rank, idempotent retry, and Headmaster visibility. The student school-code flow created an account, rejected reuse and accepted sign-in. The hosted school database retained its before/after counts of zero students, zero registers and one Auth user. Five synthetic fixture identities were disabled and their sessions expired.

**I07.** Confirmed that the existing Supabase Free plan uses operator-managed exports for recoverable backups. An isolated recovery exercise took a representative fixture from the test project, imported it into the rebuilt application schema in an independent PGlite 0.3.14 instance, wrote an actual gzip backup archive, closed the source instance and restored into a fresh one. Eleven application tables and 29 rows matched exactly. The recovered register preserved the late correction, and the academic release preserved the zero, blank and published rank. The teacher was denied access to the staff directory, while the Headmaster could read it. The drill took about 9 seconds. Archive bytes: 4265510. SHA-256: 7071dc93d7debeb8716dda20d563dc3b1cf67d08109d9b13dbe8f552b9fc1199.

The drill used synthetic data and an Auth schema stub. It did not test a complete managed Supabase export, live Auth secrets or Storage objects. Before school launch, record the school-controlled backup schedule and retention, generate and store a restricted real backup, and verify managed Auth and any Storage recovery separately.

## Work on the other eight checks

| Item | Evidence from this session | Still required |
| --- | --- | --- |
| J08 | The release build allowlists 40 website files. Hosted preview served the homepage, workspace and API, and returned 404 for the legacy demo script, notebook script and migration inventory. | Inspect the actual live release after approved promotion. |
| B09 | Added one-time Auth token-hash callback support and tests for valid, expired/used, and ambiguous links. The fragment is removed before any network request. | Verify a real received email and hosted link expiry/replay before enabling. |
| B06 | Verified the private school-issued code path against hosted Auth, including rejecting replay. | Implement and accept the separate verified-email student invitation path. |
| B10 | Verified the Headmaster directory with an actual Auth session, teacher denial, and the staff/roster rollback suite. | Complete a delivered staff invite and recipient password setup. |
| F02 | Hosted Dean rehearsal accepted unequal subject maxima, blank versus zero, and the supplied percentage and rank. | Confirm the mapping against a redacted school marks upload. |
| J09 | Hosted rehearsal covered attendance, correction, academic publication, and student setup. The daily follow-up rollback suite also passed. | Observe school staff work independently, including their account recovery. |
| K07 | The isolated class-letter regression suite passed, and the pilot script now asks the Headmaster to compare a printed letter with their current process. | Run a school-approved comparison and confirm time saved. |
| J02 | Added a pilot task matrix with role, device, task time, errors and assistance to record. | School agreement on the device list, operating costs, privacy, and acceptance criteria. |

181 Node tests passed. The draft was updated and production was neither merged nor promoted.
