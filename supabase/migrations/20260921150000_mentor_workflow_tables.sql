-- Mentor tasks assigned to mentees
CREATE TABLE public.mentor_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  title text NOT NULL,
  notes text,
  due_date date NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mentor meetings scheduled with mentees
CREATE TABLE public.mentor_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  title text NOT NULL,
  meeting_date date NOT NULL,
  start_time time NOT NULL,
  agenda text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mentor_tasks_mentor ON public.mentor_tasks(mentor_id);
CREATE INDEX idx_mentor_tasks_mentee ON public.mentor_tasks(mentee_id);
CREATE INDEX idx_mentor_tasks_due_date ON public.mentor_tasks(due_date);
CREATE INDEX idx_mentor_meetings_mentor ON public.mentor_meetings(mentor_id);
CREATE INDEX idx_mentor_meetings_mentee ON public.mentor_meetings(mentee_id);
CREATE INDEX idx_mentor_meetings_date ON public.mentor_meetings(meeting_date);

-- RLS
ALTER TABLE public.mentor_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors and mentees can view their tasks"
  ON public.mentor_tasks FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentors can create tasks"
  ON public.mentor_tasks FOR INSERT
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update tasks"
  ON public.mentor_tasks FOR UPDATE
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete tasks"
  ON public.mentor_tasks FOR DELETE
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors and mentees can view their meetings"
  ON public.mentor_meetings FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentors can create meetings"
  ON public.mentor_meetings FOR INSERT
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update meetings"
  ON public.mentor_meetings FOR UPDATE
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete meetings"
  ON public.mentor_meetings FOR DELETE
  USING (auth.uid() = mentor_id);

-- Triggers
CREATE TRIGGER update_mentor_tasks_updated_at
  BEFORE UPDATE ON public.mentor_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_meetings_updated_at
  BEFORE UPDATE ON public.mentor_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
