
-- Create tables first (no policies yet)
CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  industry text,
  stage text,
  location text,
  short_description text,
  website_url text,
  linkedin_url text,
  registration_doc_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.startup_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

CREATE TABLE public.startup_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add startup_id to posts for identity switching
ALTER TABLE public.posts ADD COLUMN startup_id uuid REFERENCES public.startups(id);

-- Enable RLS
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer functions (tables exist now)
CREATE OR REPLACE FUNCTION public.is_startup_member(_user_id uuid, _startup_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.startup_members WHERE user_id = _user_id AND startup_id = _startup_id) $$;

CREATE OR REPLACE FUNCTION public.is_startup_role(_user_id uuid, _startup_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.startup_members WHERE user_id = _user_id AND startup_id = _startup_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_startup_admin(_user_id uuid, _startup_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.startup_members WHERE user_id = _user_id AND startup_id = _startup_id AND role IN ('owner', 'admin')) $$;

-- RLS policies for startups
CREATE POLICY "Anyone can view startups" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Creators can insert startups" ON public.startups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update startups" ON public.startups FOR UPDATE USING (public.is_startup_admin(auth.uid(), id));
CREATE POLICY "Owners can delete startups" ON public.startups FOR DELETE USING (public.is_startup_role(auth.uid(), id, 'owner'));

-- RLS policies for startup_members
CREATE POLICY "Anyone can view startup members" ON public.startup_members FOR SELECT USING (true);
CREATE POLICY "Admins can add members" ON public.startup_members FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_startup_admin(auth.uid(), startup_id));
CREATE POLICY "Admins can update members" ON public.startup_members FOR UPDATE USING (public.is_startup_admin(auth.uid(), startup_id) OR auth.uid() = user_id);
CREATE POLICY "Admins can remove members" ON public.startup_members FOR DELETE USING (public.is_startup_admin(auth.uid(), startup_id) OR auth.uid() = user_id);

-- RLS policies for startup_invitations
CREATE POLICY "Admins can view invitations" ON public.startup_invitations FOR SELECT USING (public.is_startup_admin(auth.uid(), startup_id));
CREATE POLICY "Admins can create invitations" ON public.startup_invitations FOR INSERT WITH CHECK (auth.uid() = invited_by AND public.is_startup_admin(auth.uid(), startup_id));
CREATE POLICY "Admins can delete invitations" ON public.startup_invitations FOR DELETE USING (public.is_startup_admin(auth.uid(), startup_id));

-- Auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_startup_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.startup_members (startup_id, user_id, role, confirmed) VALUES (NEW.id, NEW.created_by, 'owner', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_startup_created AFTER INSERT ON public.startups FOR EACH ROW EXECUTE FUNCTION public.add_startup_owner();
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for startup logos/docs
INSERT INTO storage.buckets (id, name, public) VALUES ('startup-assets', 'startup-assets', true);
CREATE POLICY "Anyone can view startup assets" ON storage.objects FOR SELECT USING (bucket_id = 'startup-assets');
CREATE POLICY "Auth users can upload startup assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'startup-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can update startup assets" ON storage.objects FOR UPDATE USING (bucket_id = 'startup-assets' AND auth.uid() IS NOT NULL);
