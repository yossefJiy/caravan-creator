-- Add category column to site_content
ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Update existing content with appropriate categories
UPDATE public.site_content SET category = 'emails' WHERE content_key IN (
  'sender_email', 'sender_name', 'notification_emails', 
  'customer_sender_email', 'customer_sender_name'
);