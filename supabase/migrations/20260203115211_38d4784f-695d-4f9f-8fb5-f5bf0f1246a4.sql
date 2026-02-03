-- Add lead_status enum and update leads table
-- First, add a 'partial' status option and 'is_complete' flag

-- Add is_complete column to track if lead finished the full process
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS is_complete boolean NOT NULL DEFAULT false;

-- Update existing leads to be marked as complete (since they went through the full flow)
UPDATE public.leads SET is_complete = true WHERE is_complete = false;

-- Make email nullable for partial leads (they might not have email yet)
ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;

-- Add privacy_accepted column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS privacy_accepted boolean NOT NULL DEFAULT false;

-- Add privacy_accepted_at column  
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone;