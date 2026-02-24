
-- Create opportunities table
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'grant', -- grant, funding_call, accelerator, job
  organization text NOT NULL,
  organization_logo text,
  amount text,
  deadline timestamp with time zone,
  location text,
  eligibility text,
  tags text[] DEFAULT '{}',
  application_url text,
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'applied', -- applied, reviewing, accepted, rejected
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Opportunities policies
CREATE POLICY "Anyone can view opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Admins can create opportunities" ON public.opportunities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update opportunities" ON public.opportunities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete opportunities" ON public.opportunities FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Applications policies
CREATE POLICY "Users can view own applications" ON public.opportunity_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can apply" ON public.opportunity_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can withdraw" ON public.opportunity_applications FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
