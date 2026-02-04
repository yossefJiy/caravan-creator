-- Add field to track ID validation error from Morning API
ALTER TABLE public.leads ADD COLUMN id_validation_error text;

-- Add comment
COMMENT ON COLUMN public.leads.id_validation_error IS 'Stores validation error message when Morning API rejects the ID number (e.g., error 1111)';