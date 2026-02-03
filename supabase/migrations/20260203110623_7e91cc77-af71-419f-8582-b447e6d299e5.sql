-- Update RLS policies for leads table to allow client role
DROP POLICY IF EXISTS "Clients can view leads" ON public.leads;
CREATE POLICY "Clients can view leads" 
ON public.leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Clients can update leads" ON public.leads;
CREATE POLICY "Clients can update leads" 
ON public.leads 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for truck_types table to allow client role
DROP POLICY IF EXISTS "Clients can manage truck types" ON public.truck_types;
CREATE POLICY "Clients can manage truck types" 
ON public.truck_types 
FOR ALL 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for truck_sizes table to allow client role
DROP POLICY IF EXISTS "Clients can manage truck sizes" ON public.truck_sizes;
CREATE POLICY "Clients can manage truck sizes" 
ON public.truck_sizes 
FOR ALL 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for size_features table to allow client role
DROP POLICY IF EXISTS "Clients can manage size features" ON public.size_features;
CREATE POLICY "Clients can manage size features" 
ON public.size_features 
FOR ALL 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for equipment table to allow client role
DROP POLICY IF EXISTS "Clients can manage equipment" ON public.equipment;
CREATE POLICY "Clients can manage equipment" 
ON public.equipment 
FOR ALL 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for equipment_categories table to allow client role
DROP POLICY IF EXISTS "Clients can manage equipment categories" ON public.equipment_categories;
CREATE POLICY "Clients can manage equipment categories" 
ON public.equipment_categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'));