# RUHUKA first-handover pack

Prepared 10 November 2026 for the director and the school's designated operator. The school acceptance record and production release approval are tracked separately in HANDOVER_CHECKLIST.md.

## Access and ownership

| Access | Current place | Handover action |
| --- | --- | --- |
| Website source | gabary404-alt/RUHUKA.ui, draft integration PR #10 | Confirm who owns the repository, who reviews changes and who can deploy. |
| Website hosting | Vercel project ruhuka_ui. Public URL is ruhukaui.vercel.app. | Nominate a school-owned hosting owner and verify domain access and rollback permission. |
| Database and accounts | Supabase project RUHUKA system, region eu-west-1. | Nominate a school-owned owner. Verify sign-in, recovery and the restore route before transferring or retiring access. |
| School operator | Existing director/temporary Headmaster. | Create a separately identified school Headmaster. Verify the new account and recovery before disabling the former account. Preserve historical identities and audit rows. |
| Chat provider | Existing production provider credential is stored in Vercel. The preview does not call the paid provider. | Confirm the provider owner, billing terms and approved use. Add a distinct production budget and public information configuration before promotion. |
| Recovery email | Email provider exists, but the application invitation and recovery gates remain disabled. | Approve an authorised sender and verify real delivery and links before enabling. |
| School support | School administrator handles account and record questions. Technical maintainer handles deployment and service errors. | Fill in named contacts and coverage with the school under J11. Share no secrets in the inventory. |

## Costs and limits

- Supabase reported the Free plan. The plan has no paid subscription selected in the checked account. Verify backup coverage and any required upgrade before agreeing the production budget.
- The Vercel logs API identified the hosting team as Hobby. The billing connector returned no cost record for the reviewed period. Confirm account eligibility for the school release and any invoice with the hosting owner. The observed plan is not a guarantee of future charges.
- Provider pricing and usage billing were not available. Production should start with an explicitly approved cap. Local help and approved public FAQ answers use no provider reservation.
- Domain renewal, an email delivery service, and any paid backup or observability plan have no approved cost recorded here. Keep the release estimate separated from actual invoices.
- New paid subscriptions authorised in this handover pack: none.

## First school week

| When, Kigali time | Owner | Check |
| --- | --- | --- |
| First school morning after release | Headmaster and pilot teacher | Confirm the authorised class list, account access, one teacher register and officer receipt. |
| After the first correction | Discipline Officer | Confirm that the correction reason and original actor remain in history, and that the report reflects the correction. |
| Third school day | Headmaster and technical maintainer | Review failed imports, account recovery requests and safe support references. Record completion time and issues from the pilot staff. |
| End of first school week | Director and school lead | Review acceptance evidence, open defects, data handling and operating costs. Agree the next support window. |

These checkpoints are tied to the release date. Record names and confirm times at school acceptance. The operating support agreement remains J11.

## Known limits and later work

The pilot has a strict one-worksheet CSV/XLSX roster format. The school's own files and academic format still need approved examples. The student print summary covers one results release. It is separate from the official annual report. Staff email delivery and the full device matrix need live school verification. Role sign-in, independent device operation, backup recovery, ownership transfer and production approval have their own checklist items.

The deferred backlog retains student online absence explanations, the staff notebook, parent portal and messaging, SMS, automatic promotion, advanced charts/leaderboards and elaborate effects. The full list and rationale remain in HANDOVER_CHECKLIST.md.

For an incident, keep the Kigali date/time, screen, safe reference and whether the action was confirmed. Do not attach student records, codes, passwords or reset links. See OPERATIONS_AND_HANDOVER.md for recovery and rollback.

## Pilot rehearsal

Use the protected preview with the **Test workspace** banner. It has a separate database. Use synthetic learners, marks and discipline records. Keep school records in the approved school workspace.

| Person | Task to complete independently | What to record |
| --- | --- | --- |
| Patron or teacher | Open an assigned class on a phone, mark the register, check the totals and submit. Try the same class again and read the duplicate message. | Time to first successful submission and whether the person knows it reached the school. |
| Discipline Officer | Open the class overview, find the submitter, correct a late arrival and check the correction history. Review an attendance concern. | Whether the officer can find and explain the changed record unaided. |
| Dean of Studies | Upload a results file containing an empty mark and a zero. Review the warning, publish one named release and check ranks. | Whether both values stay distinct and which wording caused hesitation. |
| Headmaster | Find the publication notice, open a class letter, confirm the date and selected sources, and print it. | Time saved compared with the current report and any missing school-required section. |
| School administrator | Use the agreed reset procedure on a test account, then check sign-in again. | Recovery time and whether the staff member needed outside help. |

Use one agreed phone/browser, one tablet and one desktop for the core tasks. Include a short-screen chat, phone keyboard, horizontal report tables, Tab/Shift+Tab and printing. Record device/browser versions, task time, mistakes, whether assistance was needed and a pass/fail result. Use role labels in the pilot notes instead of student names or credentials. Confirm with the school before treating the device matrix or timings as accepted.
