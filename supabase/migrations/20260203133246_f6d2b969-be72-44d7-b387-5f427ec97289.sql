
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert leads with validation" ON public.leads;

-- Create a PERMISSIVE INSERT policy for public users
CREATE POLICY "Anyone can insert leads with validation"
ON public.leads
FOR INSERT
TO public
WITH CHECK (
  (full_name IS NOT NULL) AND 
  (full_name <> ''::text) AND 
  (phone IS NOT NULL) AND 
  (phone <> ''::text) AND 
  ((status IS NULL) OR (status = 'new'::text))
);
