ALTER TABLE public.virtual_classroom_resources
ADD COLUMN type TEXT NOT NULL DEFAULT 'link' CHECK (type IN ('link', 'gdrive', 'lms'));
