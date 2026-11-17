# LDK Codex Cloud handoff

Snapshot: 17 November 2026, Africa/Kigali. Refresh the branch, deployment and checklist status before relying on this snapshot.

## Where work stands

RUHUKA is building Lycée de Kigali's public website and signed-in school workspace. The first handover prioritizes understandable phone workflows, low data use and separate staff and student permissions. The public site runs on Vercel and the connected workspace uses Supabase. Source: `gabary404-alt/RUHUKA.ui`, branch `main`. Production: https://ruhukaui.vercel.app/.

[PR #11](https://github.com/gabary404-alt/RUHUKA.ui/pull/11) merged at `b128cb44a6f1e3ad65810afd05a6a01fc8f95170`. Vercel reports that commit READY in production. It adds clearer role menus, roster help, compact Kigali and sports imagery, news stickers, near-black dark mode and scheduled class-year rollover. The latest release checks passed. Full visual and signed-in staff acceptance remain open. The last recorded checklist is 98 verified, 18 open and 12 deferred. A successful build or deployment does not close a school acceptance item.

## Reusable cloud environment

Open Settings → Codex Cloud → Environments → LDK environment → Edit. Keep the GitHub repository attached. Use Node 24 to match CI and keep the environment private. Ask the setup chat to record these commands for installation and preparation from the repository root:

```bash
set -eu
node --version
node scripts/build-public-site.cjs
node scripts/check-release.cjs
```

No npm dependencies, environment variables or HTTP secrets are needed for the baseline. In the setup chat also run `node --test tests/*.test.js`. For the Start skill, instruct Codex to start a static preview only when requested: rebuild, then run `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist`. This serves public pages and does not implement Vercel serverless endpoints or connected sign-in.

Save and Publish (or Republish), then select the environment in a **new** Work in → Cloud task. Each new task has its own workspace. Open an existing Cloud task again to retain its working state. This handoff captures project decisions from the conversation in source control so new tasks can use them independently.

## Tools and access

| Task | Access |
| --- | --- |
| Change source and run tests | GitHub checkout and Node 24. Leave broad internet access disabled for baseline checks. |
| Inspect deployments | Use the Vercel connection if offered in the selected Codex task. Check the deployment commit before testing. |
| Inspect schema or rehearse school workflows | Use Supabase connection if offered, or the existing isolated Vercel preview and its separate test accounts. Isolated project ref: `utbgxbweuustxmacpcuj`. Verify the Test workspace label and the backend target before entering synthetic records. |
| Check production | Production project ref: `jsqiqxflgokfdooogcst`. Use read-only smoke checks initially. Production account ownership and school data acceptance are tracked separately. |

GitHub checkout access and tool connections are separate. Verify which GitHub, Vercel and Supabase tools are available inside the new task before relying on them. If a task needs shell access to an HTTPS service, allow its exact hostname only. The isolated Vercel preview expects `RUHUKA_TEST_SUPABASE_URL` and `RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY` in Vercel's Preview environment. Keep existing values there. Never copy production database passwords, service-role keys or staff credentials into the reusable environment.

## Decisions to carry forward

- Headmaster sets three term dates and can schedule the next class year once. The scheduled change runs after Term 3 and preserves history. It leaves each student's class and status intact. Promotion and repeat decisions are reviewed by staff.
- Roster statuses are Active, Transferred, Graduated and Archived. Blank means Active on a new record and preserves status on an existing record.
- Duplicate daily attendance must preserve the first submission. Discipline Officers can correct attendance with a reason and history. Role permissions still apply on the server.
- Dean publishes marks. Keep blanks distinct from zero and keep ranking based on supplied overall percentages. Class letters keep attendance, academics and discipline distinct. Confirm the school's annual grading and report format before implementing an annual report.
- Prioritize staff working on phones and low bandwidth. Use verified school facts and approved photography. Parent portal, SMS, automated promotion, advanced leaderboards, elaborate 3D, student absence justification and the staff notebook remain outside first handover.

## First task

Read `AGENTS.md`, this file and `HANDOVER_CHECKLIST.md`. Confirm the latest main commit and Node version, then run the three release commands in `AGENTS.md`. Report test counts and failures, the current handover tally and the next check you can complete with synthetic data. Verify tool availability with read-only checks. Work from `DIRECTOR_TESTING.md` for role trials, and prefer the latest UI labels and evidence when older instructions differ. Prioritize the pending phone and signed-in role review. Update the checklist only with evidence.
