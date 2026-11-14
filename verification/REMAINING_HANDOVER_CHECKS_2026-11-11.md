# Review of the 18 remaining handover checks — 11 November 2026

Reviewed every open item against the current release candidate. Production release, school acceptance and email-dependent outcomes require their own evidence. The 12 postponed items are outside this pass.

| Check | Work or evidence reviewed | Remaining closure condition |
| --- | --- | --- |
| B06 | Isolated student setup, sign-in and used-code rejection previously passed. The school-issued code remains usable in the pilot. | Implement and verify the separate email invitation workflow. |
| B09 | Automated recovery checks cover the Auth callback, one-time token handling, invalid responses and successful password saves. | Verify actual invitation/reset delivery, expiry and replay on the hosted email path. |
| B10 | Staff roles, directory, revocation and Headmaster authorization have synthetic coverage. | Deliver a staff invitation, complete setup and confirm the invited account can sign in with only the assigned role. |
| C07 | Director supplied the annual report visual and confirmed there is no standard discipline file. RUHUKA blank discipline files and an example now guide staff. | Confirm a redacted roster or the school's adoption of RUHUKA's roster template, and the marks input format. |
| F02 | Rechecked different subject maxima, supplied overall, rank, blank versus zero and student print. | Validate a real-shaped input or obtain school adoption of the RUHUKA marks template. Confirm annual weights and grading before offering an official annual report. |
| I01 | Rechecked the current layout and the new student discipline section. Updated the print masthead and table caption. | Complete the phone, tablet and desktop browser matrix, including physical keyboard and touch use. |
| I11 | Student print no longer includes internal release review notes. Re-ran Node tests and reviewed remaining issues. | Resolve any remaining release blockers and rerun the affected checks after the staff trial. |
| J01 | Headmaster confirmed as the designated owner. A whole-system staff trial is planned. | Confirm testers, schedule and the current school process. |
| J02 | Expanded the role-by-role test plan. | Agree the supported devices, acceptance criteria, data handling and operating costs with the school. |
| J03 | Pilot roles and complete test route recorded. | Run the real staff session and record timing, errors and help required. |
| J04 | Real school records were kept out of this pass. | Receive the approved first import and public/contact content and verify the totals. |
| J05 | Ownership instructions record the Headmaster and defer the destination email decision to handover. | Establish and verify school-owned account and service access, including recovery. |
| J08 | Preview package excludes legacy demo scripts and development files. | Check the signed-off live production release. |
| J09 | Full pilot route now covers attendance, discipline, academics, recovery and student records. | Observe staff complete the workflow independently. |
| J10 | Production remains on the previous release. | Obtain school sign-off, run the final release checks and record deployment. |
| J11 | Handover pack records the designated owner and outstanding contact decisions. | Agree support contacts, monitoring and maintenance responsibilities. |
| K01 | Class-letter source filters remain available. | Confirm the actual school summary practice and preferred date range and sources. |
| K07 | School comparison is part of the full pilot plan. | Verify with staff that the letter is usable and saves retyping. |

The report screenshot and its student details are not stored in the source repository.

## Staff pilot preflight

Re-ran the 183 Node tests and checked relative links and assets across all seven pages in the 40-file website build. The test preview was READY and the live Vercel deployment was still on the original production commit. Eight isolated database regression suites passed in the previous review of this same application build.

Ran real Chromium against the current website files with a simulated school API and synthetic records. The teacher (320px), patron/matron (360px), Discipline Officer (390px), Dean (768px), Headmaster (1280px) and Student (320px) could reach their main screens and sign out. Checked width fit on every role, register controls on the narrow Staff screens, short-screen chat input and Escape focus return, and Student discipline and results print isolation. This evidence covers I01/J09 technical preparation. Real staff devices, the on-screen keyboard, delivery of real email, real school imports, and timed acceptance still need their respective trials.

The isolated school database contains two synthetic learners and the previous sample register and results release. Earlier disposable user accounts remain disabled. For a hands-on pilot, issue fresh isolated role accounts to the confirmed testers. A screen-share demonstration can begin from the protected preview. Production sign-off remains a separate step.
