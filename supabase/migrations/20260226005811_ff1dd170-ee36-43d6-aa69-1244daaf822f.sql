
-- Track which investors users have viewed recently
CREATE TABLE public.investor_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investor_id TEXT NOT NULL,
  investor_name TEXT NOT NULL,
  investor_icon TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investor views" ON public.investor_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investor views" ON public.investor_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investor views" ON public.investor_views
  FOR DELETE USING (auth.uid() = user_id);

-- Track shortlisted investors
CREATE TABLE public.investor_shortlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investor_id TEXT NOT NULL,
  investor_name TEXT NOT NULL,
  investor_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, investor_id)
);

ALTER TABLE public.investor_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortlists" ON public.investor_shortlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortlists" ON public.investor_shortlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortlists" ON public.investor_shortlists
  FOR DELETE USING (auth.uid() = user_id);

-- Session reminders tracking (which reminders have been sent)
CREATE TABLE public.session_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT '24h',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, user_id, reminder_type)
);

ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.session_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders" ON public.session_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
