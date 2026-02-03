-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop any existing insert policy with the same name (idempotent)
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads with validation" ON public.leads;

-- Create a PERMISSIVE INSERT policy explicitly for anon/authenticated
-- This is the public website lead-capture use case.
CREATE POLICY "Public can insert leads"
ON public.leads
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Minimum required fields
  full_name IS NOT NULL AND btrim(full_name) <> '' AND
  phone IS NOT NULL AND btrim(phone) <> '' AND

  -- Must accept privacy policy in the UI
  privacy_accepted IS TRUE AND

  -- Allow status to be omitted/empty/case-variant; only allow initial 'new'
  lower(coalesce(nullif(status, ''), 'new')) = 'new'
);
