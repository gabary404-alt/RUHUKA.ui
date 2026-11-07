DROP POLICY IF EXISTS "Students can read own student record" ON public.students;
CREATE POLICY "Students can read own student record"
 ON public.students FOR SELECT TO authenticated
 USING (auth_user_id = (select auth.uid()));;
