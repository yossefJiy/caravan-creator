-- Add ID number field to leads table for ח.פ. / ת.ז.
ALTER TABLE public.leads
ADD COLUMN id_number VARCHAR(20) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.id_number IS 'ח.פ. (business ID) or ת.ז. (personal ID number) for invoicing';