# RUHUKA attendance foundation — setup and test notes

This work is on `feat/attendance-foundation`. It is not a production release. The old Supabase project and live website are not part of this branch.

## One-time setup for the new Supabase project

Project ref: `jsqiqxflgokfdooogcst`

1. Open the new project in Supabase.
2. Go to **Authentication → Users → Add user** and create the headmaster's email/password account. Do not put a service-role key in the website.
3. Copy that user's UUID from the Auth users list.
4. Open **SQL Editor** and run the following after replacing the two placeholders:

```sql
insert into public.profiles (id, full_name, role, is_active)
values ('AUTH_USER_UUID_HERE', 'Headmaster', 'headmaster', true)
on conflict (id) do update
set full_name = excluded.full_name,
    role = 'headmaster',
    is_active = true;
```

5. Sign in using the **Admin** tab with that email and password. The role comes from the database profile, not from the tab selection.
6. Create staff/student Auth accounts and matching `profiles` rows when you are ready to test those portals. A student also needs a matching `students.auth_user_id` link.

## CSV imports

Choose the import type first, download its template, fill it in, then upload the CSV or paste its contents. Preview and validation must pass before confirming the import.

### Student records

Required: `school_id,full_name,class_name`

Optional: `gender,stream,boarding_status,date_of_birth,parent_phone`

Example class value: `S5 Stream 1`. Gender accepts `M`, `F`, `male`, `female`, or `other`.

### Discipline records

Required: `school_id,points_change,note`

Optional: `term,academic_year,category`

`points_change` is a signed change, not the student's final score. Imported rows are stored in `discipline_records`. A stable source key prevents the same CSV row from being inserted again if the same file is re-imported.

### Academic results

Required: `school_id,subject,marks_obtained,marks_possible,term,academic_year`

Optional: `assessment`

A repeat import of the same student/subject/assessment/term/year updates that result. Other subjects and older terms remain in the database. Academic percentages are recalculated from all saved results for the affected students.

## Fictional students

The generated website students are tagged as demo records when created. On a successful headmaster login, those demo rows are copied to the new database with `is_demo = true`; duplicate school IDs are not allowed to overwrite existing rows. The **Settings → Danger Zone → Delete Demo Students** action deletes only database rows marked `is_demo = true`, along with their linked attendance, discipline and academic test records. It also removes tagged demo students from the browser's local test list.

## Attendance

The staff attendance screen reads active students from the database, loads any saved attendance for the selected date/period, and saves present/absent rows to `attendance_records`. One record per student/date/period is enforced by a unique index. Attendance reports are based on saved records, not a browser-only draft.

## Important testing limitation

A real Supabase Auth user and matching active `profiles` row are required before sign-in can work. The code cannot securely create the first headmaster Auth account from a browser page. Verify login, permissions, attendance save/reload, imports and demo cleanup in the branch preview before merging or deploying.


### Update existing student details

Required: `school_id` plus at least one field to update. Optional: `full_name,gender,class_name,stream,boarding_status,date_of_birth,parent_phone`. This option updates existing IDs only and does not create new students.

### Attendance records

Required: `school_id,attendance_date,status`; optional: `period,note`. Date format is `YYYY-MM-DD`; status is `present`, `absent`, `late`, or `excused`; period is `morning`, `afternoon`, or `full_day`. The student must already exist. Importing the same student/date/period updates that attendance entry.
