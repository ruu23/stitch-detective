-- Create storage bucket for closet item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-items', 'closet-items', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for closet-items bucket
CREATE POLICY "Users can view own closet item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own closet item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own closet item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own closet item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);