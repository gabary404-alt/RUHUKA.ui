CREATE TABLE IF NOT EXISTS public.academic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  assessment text NOT NULL DEFAULT 'Term result',
  marks_obtained numeric(7,2) NOT NULL CHECK (marks_obtained >= 0),
  marks_possible numeric(7,2) NOT NULL CHECK (marks_possible > 0 AND marks_obtained <= marks_possible),
  term text NOT NULL,
  academic_year text NOT NULL,
  imported_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academic_results_student_year_term_idx
  ON public.academic_results(student_id, academic_year, term);
CREATE INDEX IF NOT EXISTS academic_results_subject_idx
  ON public.academic_results(subject);
ALTER TABLE public.academic_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authorized staff read academic results" ON public.academic_results;
CREATE POLICY "Authorized staff read academic results"
 ON public.academic_results FOR SELECT TO authenticated
 USING (public.ruhuka_has_role(ARRAY['headmaster','dean','discipline','teacher','staff'])
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.auth_user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Authorized staff add academic results" ON public.academic_results;
CREATE POLICY "Authorized staff add academic results"
 ON public.academic_results FOR INSERT TO authenticated
 WITH CHECK (public.ruhuka_has_role(ARRAY['headmaster','dean','teacher','staff'])
             AND (imported_by IS NULL OR imported_by = (select auth.uid())));
DROP POLICY IF EXISTS "Headmaster updates academic results" ON public.academic_results;
CREATE POLICY "Headmaster updates academic results"
 ON public.academic_results FOR UPDATE TO authenticated
 USING (public.ruhuka_has_role(ARRAY['headmaster']))
 WITH CHECK (public.ruhuka_has_role(ARRAY['headmaster']));
DROP POLICY IF EXISTS "Headmaster deletes academic results" ON public.academic_results;
CREATE POLICY "Headmaster deletes academic results"
 ON public.academic_results FOR DELETE TO authenticated
 USING (public.ruhuka_has_role(ARRAY['headmaster']));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_results TO authenticated;
;
