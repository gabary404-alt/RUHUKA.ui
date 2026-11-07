DROP INDEX IF EXISTS public.discipline_records_import_source_key;
CREATE UNIQUE INDEX discipline_records_import_source_key
 ON public.discipline_records(student_id, source_key);;
