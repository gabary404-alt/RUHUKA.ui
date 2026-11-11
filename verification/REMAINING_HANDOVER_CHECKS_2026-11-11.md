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
