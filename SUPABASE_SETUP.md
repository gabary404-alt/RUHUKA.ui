# Supabase setup boundary

The browser app currently runs in local demo mode. Student and workflow changes are stored in the current browser's `localStorage`; they are not shared between devices or staff. `schema.sql` is the PostgreSQL/Supabase database blueprint, but the app is not yet connected to a Supabase project because this workspace has no project URL or anon key.

The local admin UI now stages discipline imports for review, requires a reviewer note and a source-verification confirmation before applying their totals, and retains a browser-local audit history. This is a workflow demonstration, not a security boundary: the current login is demo-only, local storage can be changed by the browser user, and no review is authenticated. Do not treat local approvals or imported/demo data as official records.

Roster editing and roster CSV imports do not write discipline totals. In the future database workflow, a reviewer must approve a discipline import batch with a review note and verification reference; database triggers reject official-total changes without a matching verified discipline event in that approved batch. Keep all approval and audit operations behind authenticated RLS-protected requests.

## Set up the database

1. Create a Supabase project for the school and keep its database password in the school's password manager.
2. Open the Supabase SQL Editor and run `supabase/schema.sql`.
3. Confirm all tables have Row Level Security enabled and test policies using separate student, teacher, discipline officer, dean, and headmaster test accounts.
4. Set trusted `app_metadata.school_role` claims server-side. Never let a browser update its own role claim.
5. Keep the service-role key only in server-side Vercel environment variables. Never put it in `index.html`, `script.js`, a public config file, or browser storage.

## Login and automatic accounts

The current login screen is demo-only and this implementation deliberately does not modify it. Future login code should use Supabase Auth and map each authenticated student to `students.auth_user_id`. The student portal adapter accepts the stable `students.student_id`; authenticated code must resolve that ID from the signed-in user's linked student row, not from an editable login field. A roster import can create student profile rows, but it must not create Auth accounts from browser JavaScript: account provisioning requires a trusted server-side function using the service-role key, followed by a secure invite/password setup. Never create a shared default password for imported students.

## Application connection still required

After the login/auth owner provides the project's public URL and anon key, connect the app through `@supabase/supabase-js` and replace the local persistence functions with authorized Supabase operations. The anon key is intended for browser use only when every relevant table has tested RLS policies. The service-role key is never a browser credential.

Cloud persistence and cross-device use are not active until that integration and deployment are complete. Until then, do not enter identifiable real student or guardian data. Export a JSON backup before using the demo data on a browser that contains changes you need to preserve.

## Useful tools

- Supabase: Auth, PostgreSQL, Row Level Security, database backups, and optional file storage.
- `@supabase/supabase-js`: browser client for requests governed by RLS.
- Vercel serverless functions or Supabase Edge Functions: trusted server-side operations such as account provisioning and high-impact imports.
- CSV is currently handled natively by the app. SheetJS is only needed if the school requires `.xlsx` files; a PDF library is only needed if downloadable PDFs are required. Current reports export CSV.
- GitHub and a staging Supabase project: version schema changes and validate imports/roles before touching production records.

## Data model

`schema.sql` defines students, classes, attendance sessions and records, academic results, append-only discipline events, import batches, workflow reviews, and audit events. Discipline event history is append-only for ordinary authenticated users; changing a current official discipline total should happen only as part of a verified official import workflow.
