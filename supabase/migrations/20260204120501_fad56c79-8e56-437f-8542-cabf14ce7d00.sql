-- Create user_permissions table for granular permissions
CREATE TABLE public.user_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    can_delete_leads BOOLEAN NOT NULL DEFAULT false,
    can_manage_pricing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'can_delete_leads' THEN COALESCE((SELECT can_delete_leads FROM public.user_permissions WHERE user_id = _user_id), false)
    WHEN 'can_manage_pricing' THEN COALESCE((SELECT can_manage_pricing FROM public.user_permissions WHERE user_id = _user_id), false)
    ELSE false
  END
$$;

-- Update RLS policy for leads deletion - allow clients with permission
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Users with permission can delete leads"
ON public.leads
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'client'::app_role) 
    AND has_permission(auth.uid(), 'can_delete_leads')
  )
);

-- Create pricing table
CREATE TABLE public.pricing (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_type TEXT NOT NULL CHECK (item_type IN ('truck_type', 'truck_size', 'equipment')),
    item_id UUID NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'ILS',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(item_type, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pricing
CREATE POLICY "Admins can manage pricing"
ON public.pricing
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users with permission can view pricing"
ON public.pricing
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'client'::app_role) 
    AND has_permission(auth.uid(), 'can_manage_pricing')
  )
);

CREATE POLICY "Users with permission can manage pricing"
ON public.pricing
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'client'::app_role) 
    AND has_permission(auth.uid(), 'can_manage_pricing')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pricing_updated_at
BEFORE UPDATE ON public.pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();