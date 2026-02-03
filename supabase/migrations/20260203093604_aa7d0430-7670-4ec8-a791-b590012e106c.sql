-- Add email notification settings to site_content
INSERT INTO public.site_content (content_key, content_value, content_type, description)
VALUES 
  ('notification_emails', 'email1@storytell.co.il,email2@example.com', 'text', 'כתובות מייל לקבלת התראות לידים (מופרדות בפסיק)'),
  ('sender_email', 'leads@storytell.co.il', 'text', 'כתובת המייל השולחת (חייבת להיות מאומתת ב-Resend)'),
  ('sender_name', 'אליה קרוואנים', 'text', 'שם השולח במיילים')
ON CONFLICT (content_key) DO NOTHING;