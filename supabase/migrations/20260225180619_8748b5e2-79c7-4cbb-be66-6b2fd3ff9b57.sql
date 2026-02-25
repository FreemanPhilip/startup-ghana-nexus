
-- Create pitch_decks table to track uploaded pitch decks
CREATE TABLE public.pitch_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pitch decks" ON public.pitch_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload pitch decks" ON public.pitch_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pitch decks" ON public.pitch_decks FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for pitch decks
INSERT INTO storage.buckets (id, name, public) VALUES ('pitch-decks', 'pitch-decks', false);

CREATE POLICY "Users can upload own pitch decks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own pitch decks" ON storage.objects FOR SELECT USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own pitch decks" ON storage.objects FOR DELETE USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
