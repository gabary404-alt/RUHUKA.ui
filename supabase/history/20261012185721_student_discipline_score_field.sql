ALTER TABLE public.students
 ADD COLUMN IF NOT EXISTS discipline_points integer NOT NULL DEFAULT 40
 CHECK (discipline_points >= 0 AND discipline_points <= 40);;
