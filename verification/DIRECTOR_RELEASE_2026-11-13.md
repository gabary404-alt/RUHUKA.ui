# Director testing preparation — 13 November 2026

Starting PR head: ff824630edc542dbd3b42ac11673b5bce858bb42. PR #10 was open, draft and mergeable; Vercel check successful and preview READY. Main remains 82bc3a2a39b6ed490a8b72097518721918e46a33 until merge.

Read-only production check confirmed the designated director has an active, email-confirmed Headmaster account and the school has zero classes/students. No password, student record or private note was retrieved. Preview config points to the separate isolated project with email gates off.

Found missing production chat budget configuration. Added a distinct random server-only key as sensitive production Vercel configuration and stored only its digest in the existing private budget table. Initial limits: 8 provider reservations/minute and 80/UTC day. Rollback-only anon probe accepted the configured key and rejected a wrong key. No provider request was made; live provider response must be checked after the production build. This limits request count, not monetary spend.

Added first-login setup guidance, practical sign-in wording and corrected the AI's stale internal-development instructions. Added release-bundle validation and GitHub Actions checks. Existing public design/map/chat-close work is retained. No unconfirmed school content or generated school imagery added.

Local validation: all 184 Node tests pass; build prepares 51 files; local page and asset references resolve; legacy demo scripts, notebook entry scripts, database source and development evidence are absent from the output. Automated verification does not close the 18 school/email/device-dependent acceptance items.

The director should merge only after the updated commit's Vercel build and release checks pass. After merge, inspect the production commit/configuration and sign in personally. No production merge is recorded by this evidence file.
