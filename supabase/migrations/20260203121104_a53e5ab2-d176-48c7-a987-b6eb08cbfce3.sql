-- Create a protected email_config table for sensitive email settings
CREATE TABLE public.email_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write email config
CREATE POLICY "Only admins can manage email config"
  ON public.email_config
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate email data from site_content to email_config
INSERT INTO public.email_config (config_key, config_value, description)
SELECT content_key, content_value, description
FROM public.site_content
WHERE content_key IN ('notification_emails', 'sender_email', 'customer_sender_email');

-- Delete email data from site_content (it's now in the protected table)
DELETE FROM public.site_content 
WHERE content_key IN ('notification_emails', 'sender_email', 'customer_sender_email');

-- Add trigger for updated_at
CREATE TRIGGER update_email_config_updated_at
  BEFORE UPDATE ON public.email_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();