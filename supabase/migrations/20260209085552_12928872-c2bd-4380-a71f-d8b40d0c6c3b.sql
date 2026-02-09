
-- Create email_logs table for reliability tracking
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  to_email TEXT NOT NULL,
  cc_emails JSONB DEFAULT NULL,
  subject TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt INTEGER NOT NULL DEFAULT 1,
  error_message TEXT DEFAULT NULL,
  idempotency_key TEXT NOT NULL,
  payload_hash TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL
);

-- Create unique index on idempotency_key for fast lookups
CREATE UNIQUE INDEX idx_email_logs_idempotency_key ON public.email_logs(idempotency_key);

-- Create index on lead_id for fast lead-scoped queries
CREATE INDEX idx_email_logs_lead_id ON public.email_logs(lead_id);

-- Create index on status for monitoring
CREATE INDEX idx_email_logs_status ON public.email_logs(status);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all email logs
CREATE POLICY "Admins can manage email logs"
ON public.email_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clients can read email logs
CREATE POLICY "Clients can view email logs"
ON public.email_logs
FOR SELECT
USING (has_role(auth.uid(), 'client'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add optional helper timestamps to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS completion_link_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS lead_notification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
