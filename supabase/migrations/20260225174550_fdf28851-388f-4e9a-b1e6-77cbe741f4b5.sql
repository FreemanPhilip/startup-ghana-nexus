
-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false);

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add columns to opportunity_applications for the detailed application
ALTER TABLE public.opportunity_applications
ADD COLUMN IF NOT EXISTS cover_letter text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS additional_docs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}';
