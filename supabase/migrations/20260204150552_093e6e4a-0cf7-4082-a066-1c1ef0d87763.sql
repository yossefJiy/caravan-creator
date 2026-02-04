-- Add quote columns to leads table for Morning/Green Invoice integration
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS quote_id text,
ADD COLUMN IF NOT EXISTS quote_number text,
ADD COLUMN IF NOT EXISTS quote_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS quote_total numeric,
ADD COLUMN IF NOT EXISTS quote_url text;