-- Drop the old permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- Create a new INSERT policy with validation
-- This allows anyone to insert leads but validates that required fields are provided
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
  -- Prevent setting is_complete to true on initial insert (only admins should do this)
  AND (is_complete IS NULL OR is_complete = false)
);

-- Add DELETE policy for admins only (currently missing)
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));