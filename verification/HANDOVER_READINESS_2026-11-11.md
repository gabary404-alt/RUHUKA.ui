# Ten release-readiness checks, 11 November 2026

The source report screenshot was used only to understand the annual report layout. It is not in the repository. This batch makes implementation progress on the following ten still-open acceptance requirements.

| Check | Work and evidence | Remaining acceptance |
| --- | --- | --- |
| B10 | Staff account management, permission checks and disabling passed the hosted accounts/roster rollback suite. The client now also checks the invitation flag on submission. | Send a Headmaster invitation through approved email and complete it as staff. |
| B06 | Rechecked student setup code and recovery regression tests. The released setup path has private school-issued codes. | Enable and test the separate verified-email student invitation path with real delivery. |
| B09 | Fixed reporting after a confirmed password update when global sign-out fails. The password form closes and reports the successful update. Expired-link display and mismatched passwords remain covered. | Verify real delivery, expired and reused links, and session behavior with the approved sender. |
| I01 | Short chat screens now give the composer space. Small and short workspace screens no longer pin navigation over fields. The three affected pages request keyboard-aware viewport sizing in supporting browsers. | Actual device/browser acceptance, including iPhone keyboard, touch scrolling, and signed-in Student/Staff/Admin controls. |
| I04 | Replaced the committed database config script with a Vercel runtime endpoint. An unconfigured preview cannot render school login or account forms. The function rejects the production database URL and key in preview settings. | Run the test workspace against a separate active Supabase project, retire older preview URLs from use, and verify the exact production candidate. Chat budget storage is separately scoped on the shared project. |
| I07 | Confirmed the Free-plan backup approach and added the isolated restore procedure to the operations guide. The prior schema replay remains available. | Produce a real restricted backup and successfully restore it in isolation. |
| J08 | The live homepage still exposes the legacy demo and sample claims. Current managed database inspection found no students, classes, attendance or obvious test email domains. The draft entry points use role-based sign-in. | Release and inspect the exact production bundle, then confirm test artifacts and shortcuts are absent. |
| F02 | Checked the supplied annual report structure against the existing named-release CSV. Tests exercise different maxima, zero versus blank, and the supplied final percentage. | Confirm the layout of an actual marks upload and the annual calculation rules. The report screenshot is an output example, not a source import file. |
| I11 | Applied the preview configuration, account recovery and small-screen fixes. The Node suite passed 177 tests. | Recheck the hosted release candidate and remaining high-priority release gates. |
| J09 | Re-ran local attendance, academic and account regressions, and the hosted rollback suite for daily follow-up. | Observe actual school staff complete attendance, corrections, review, results publishing and account recovery independently. |

No checklist item is marked complete until its stated acceptance requirement is met. The tracker remains at 96 verified, 20 open, and 12 postponed.

## Hosting and merge review

Vercel built commit 47d25acb25888c89f9618a4ef29d314e7d8c3a77 as a READY preview. The protected fetch of /connected/config.js returned HTTP 200, JavaScript, Cache-Control no-store, and a null backend. The home, sign-in and account recovery pages returned HTTP 200. The preview contains no production chat provider credential. Production has the AI provider credential, but has no production chat budget variables configured for this release. Confirm those before releasing PR #10.

PR #4 duplicates the migration paths already reconciled into #10 and also changes the old homepage/demo script. PR #9 is the deferred notebook feature. Neither should be merged into main. PR #10 remains the release candidate draft. GitHub's Vercel check was successful. Its separate Cloudflare Workers check failed and remains unresolved. The project's live Vercel production deployment is still the older main build.
