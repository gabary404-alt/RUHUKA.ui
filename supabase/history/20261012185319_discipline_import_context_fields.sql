ALTER TABLE public.discipline_records
 ADD COLUMN IF NOT EXISTS term text,
 ADD COLUMN IF NOT EXISTS academic_year text,
 ADD COLUMN IF NOT EXISTS category text;;
