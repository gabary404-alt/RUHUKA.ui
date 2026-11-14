-- RUHUKA attendance foundation: additive changes only.
-- Existing student rows and attendance history are preserved.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'full_day';

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_period_check
  CHECK (period IN ('morning', 'afternoon', 'full_day'));

CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_student_date_period_key
  ON public.attendance_records (student_id, attendance_date, period);

-- Authorization comes from the server-managed profiles table, not user-editable metadata.
CREATE OR REPLACE FUNCTION public.ruhuka_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (select auth.uid())
      AND p.is_active = true
      AND p.role = ANY (allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.ruhuka_has_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ruhuka_has_role(text[]) TO authenticated;

DROP POLICY IF EXISTS "Staff can read students" ON public.students;
DROP POLICY IF EXISTS "Headmaster manages students" ON public.students;
CREATE POLICY "Staff can read students"
  ON public.students FOR SELECT TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff']));
CREATE POLICY "Headmaster manages students"
  ON public.students FOR ALL TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster']))
  WITH CHECK (public.ruhuka_has_role(ARRAY['headmaster']));

DROP POLICY IF EXISTS "Authorized staff can read attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Authorized staff can record attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Headmaster manages attendance" ON public.attendance_records;
CREATE POLICY "Authorized staff can read attendance"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff']));
CREATE POLICY "Authorized staff can record attendance"
  ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff'])
    AND (marked_by IS NULL OR marked_by = (select auth.uid()))
  );
CREATE POLICY "Authorized staff can update attendance"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff']))
  WITH CHECK (
    public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff'])
    AND (marked_by IS NULL OR marked_by = (select auth.uid()))
  );
CREATE POLICY "Headmaster deletes attendance"
  ON public.attendance_records FOR DELETE TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster']));

-- Restrict profiles to a user's own profile and allow headmaster to review staff/student roles.
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Headmaster reads all profiles" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (select auth.uid()));
CREATE POLICY "Headmaster reads all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster']));

-- Broadcasts: staff can read; authenticated staff can create messages as themselves.
DROP POLICY IF EXISTS "Staff can read broadcasts" ON public.broadcasts;
DROP POLICY IF EXISTS "Staff can create broadcasts" ON public.broadcasts;
CREATE POLICY "Staff can read broadcasts"
  ON public.broadcasts FOR SELECT TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff']));
CREATE POLICY "Staff can create broadcasts"
  ON public.broadcasts FOR INSERT TO authenticated
  WITH CHECK (
    public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff'])
    AND (sender_id IS NULL OR sender_id = (select auth.uid()))
  );

-- Discipline history remains staff-readable; authorized staff may add records,
-- but only the headmaster can remove them.
DROP POLICY IF EXISTS "Staff can read discipline records" ON public.discipline_records;
DROP POLICY IF EXISTS "Staff can create discipline records" ON public.discipline_records;
DROP POLICY IF EXISTS "Headmaster deletes discipline records" ON public.discipline_records;
CREATE POLICY "Staff can read discipline records"
  ON public.discipline_records FOR SELECT TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff']));
CREATE POLICY "Staff can create discipline records"
  ON public.discipline_records FOR INSERT TO authenticated
  WITH CHECK (
    public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff'])
    AND (created_by IS NULL OR created_by = (select auth.uid()))
  );
CREATE POLICY "Headmaster deletes discipline records"
  ON public.discipline_records FOR DELETE TO authenticated
  USING (public.ruhuka_has_role(ARRAY['headmaster']));

GRANT SELECT ON public.students, public.attendance_records, public.discipline_records, public.broadcasts, public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.students, public.attendance_records, public.discipline_records TO authenticated;
GRANT INSERT ON public.broadcasts TO authenticated;
;
