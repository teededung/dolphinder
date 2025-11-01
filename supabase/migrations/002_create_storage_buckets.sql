-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars Bucket Policies
-- Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Projects Bucket Policies
-- Policy: Allow authenticated users to upload their own project images
CREATE POLICY "Users can upload their own project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own project images
CREATE POLICY "Users can update their own project images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'projects' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own project images
CREATE POLICY "Users can delete their own project images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'projects' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public to view project images
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'projects');

