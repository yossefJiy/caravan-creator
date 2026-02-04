-- Add cost_price column and rename price to sale_price
ALTER TABLE public.pricing 
ADD COLUMN cost_price numeric NOT NULL DEFAULT 0;

-- Rename price column to sale_price
ALTER TABLE public.pricing 
RENAME COLUMN price TO sale_price;