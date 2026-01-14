-- Create table for AI content history
CREATE TABLE public.ai_content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  model_used TEXT,
  target_type TEXT,
  target_id TEXT,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_content_history ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage AI content history"
ON public.ai_content_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_ai_content_history_created_at ON public.ai_content_history(created_at DESC);
CREATE INDEX idx_ai_content_history_content_type ON public.ai_content_history(content_type);