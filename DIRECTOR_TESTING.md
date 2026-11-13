# LDK director review and first handover

Updated 13 November 2026. Merge for testing and school handover are separate decisions.

## Start your review

After PR #10 is merged and Vercel reports READY, open https://ruhukaui.vercel.app/connected/ and select Staff / administrator. Use your existing account and password. The production Headmaster account is active and email-confirmed; its password was not read or changed.

The production database currently has no students or classes. School desk contains Create class, Set term dates and individual student management; Roster import is a separate navigation item. Role guides now explain the setup order. An empty list is not a failed login.

For made-up records and full multi-role trials, use the PR preview's separate Test workspace. The preview database has separate accounts: the production password/account does not automatically work there. Rehearsal accounts from automated tests are disabled. Confirm who is testing and provision fresh accounts privately; never put credentials in this repository or use one Headmaster account for all staff.

Email invitations and password recovery are not yet enabled. Students can use private school-issued setup/reset codes. Staff access needs the account administrator until email delivery is verified. The annual report screenshot is a visual reference; the current print is a single-release report, not an approved annual report.

## Test the complete workflow

| Role | Action | Success means |
| --- | --- | --- |
| Visitor | Read all public pages, open map and chat, close chat, navigate on phone | Correct page, readable text, normal scroll, no stuck overlay |
| Headmaster | Set classes and term dates; review roster preview | Dates and class totals match the approved input |
| Teacher or patron | Submit one class register; try a duplicate | Officer sees submission; duplicate cannot replace it |
| Discipline Officer | Correct a late arrival with a reason | History retains original record; summary updates |
| Discipline Officer | Add one student, request/import a whole roster | Headmaster gets priority notice; bulk action requires permission |
| Dean | Upload unequal subject maxima, one blank and one zero | Warning is clear; blank stays Not recorded; rank remains visible |
| Discipline Officer | Publish a separate official discipline snapshot | Original recorder/source retained; academics not mixed in |
| Headmaster | Open notices, reports and saved class letter | Figures match source records; printing is readable |
| Student | Set password with own one-time code and open records | Own records only; used code cannot be reused |
| Each staff role | Sign out, reopen and try forbidden actions | No private content after sign-out; unauthorised action denied |

Record device/browser, task, time taken, result, error and help needed. Send screenshots with student details hidden. Do not send passwords or setup codes.

## Remaining school handover checks

98 verified, 18 open, 12 postponed. No count is reduced by splitting a task or writing a guide.

| IDs | What remains |
| --- | --- |
| B06, B09, B10 | Student email invitations; delivered staff invitations; real recovery, expiry and replay tests |
| C07, F02 | Approved roster/marks samples or explicit adoption of our templates; annual grading rules if an annual report is required |
| I01, I11 | Physical phone/tablet/desktop trials and fixes for the problems found |
| J01, J02, J03, J09 | Named school testers, agreed acceptance/device/cost rules, independent staff trial |
| J04 | Approved school content/contact information and verified first import |
| J05 | School-owned Headmaster/service access and verified recovery |
| J08, J10 | Clean production release, post-merge checks and school acceptance |
| J11 | Named support contact, maintenance, monitoring and backup responsibilities |
| K01, K07 | Confirm class-letter practice and demonstrate that the letter saves work |

## Photography brief

Use genuine school photographs for claims about the school. Original files, horizontal, preferably at least 2400px wide; no filters, text overlays or messaging-app compression. Leave space around the subject for phone crops. Avoid visible records, name lists and computer screens. Obtain school permission and permission to publish identifiable people, especially students.

1. **Main campus:** entrance or recognisable building, tidy grounds, soft morning light. First priority for homepage/Our School.
2. **School Life:** one real activity the school confirms is current. Show the setting and action naturally; avoid staged generic classroom scenes.
3. **Learning facilities:** library, laboratory or classroom the school actually uses. An empty well-lit room is useful if people cannot be photographed.
4. **Sport:** actual court/field and, if approved, a real training session. Do not imply an old award photo is a current team.
5. **Leadership (optional):** only after a leadership section is agreed. Matching head-and-shoulders portraits against a simple background, with confirmed names, roles and approved short messages.

Keep the existing book-and-drawing-tools illustration beside Academics. Any future generated work should be decorative: a restrained ivory/green/red ink drawing of books and learning tools, or an abstract layered-hills illustration for an approved Rwanda/Kigali section. Do not generate school buildings, students, staff, trophies or a supposedly real campus view. No additional generated image is required to start testing.

## Information to confirm

1. Who will test each role, and which email addresses may receive test invitations?
2. Should we adopt the downloadable roster/results templates, or will the school supply redacted samples? What annual weighting/grading rules apply?
3. Which current activities, facilities and academic combinations may we publish? Confirm office contacts and admissions wording.
4. What should a Rwanda/Kigali section say about this school? Supply the intended message before it is written.
5. Who owns support, backups and service bills after handover, and which account receives recovery emails?

The director can begin reviewing before all these answers arrive. The school handover date depends on the email tests, school files, staff trial and resulting fixes; it cannot honestly be guaranteed today.
