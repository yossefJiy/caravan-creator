-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert leads with validation" ON public.leads;

-- Create a corrected INSERT policy
-- Allows anyone to insert leads with basic validation
-- The is_complete flag can be set by the configurator flow
CREATE POLICY "Anyone can insert leads with validation" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Ensure required fields are provided
  full_name IS NOT NULL 
  AND full_name <> ''
  AND phone IS NOT NULL 
  AND phone <> ''
  -- Prevent setting status to something other than 'new' on initial insert
  AND (status IS NULL OR status = 'new')
);