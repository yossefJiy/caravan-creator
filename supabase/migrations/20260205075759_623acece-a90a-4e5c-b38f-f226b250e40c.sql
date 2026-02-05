-- Fix Storage policies for equipment-images bucket to allow client role to upload/update/delete

-- Drop existing admin-only policies
DROP POLICY IF EXISTS "Admins can upload equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete equipment images" ON storage.objects;

-- Create new policies that allow both admin and client roles

-- Upload policy
CREATE POLICY "Admin and Client can upload equipment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-images' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'client'))
);

-- Update policy
CREATE POLICY "Admin and Client can update equipment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipment-images' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'client'))
);

-- Delete policy
CREATE POLICY "Admin and Client can delete equipment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-images' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'client'))
);