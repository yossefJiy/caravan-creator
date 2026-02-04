-- Add quote_created_at column to track when quote was created (separate from when it was sent)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS quote_created_at TIMESTAMP WITH TIME ZONE;