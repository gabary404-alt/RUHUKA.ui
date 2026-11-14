ALTER TABLE public.discipline_records
 ADD COLUMN IF NOT EXISTS source_key text;
CREATE UNIQUE INDEX IF NOT EXISTS discipline_records_import_source_key
 ON public.discipline_records(student_id, source_key)
 WHERE source_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS academic_results_natural_key
 ON public.academic_results(student_id, subject, assessment, term, academic_year);;
