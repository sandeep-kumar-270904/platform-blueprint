-- Phase 5-7 Advanced Features Schema

-- Polls
CREATE TABLE public.virtual_classroom_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.virtual_classroom_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.virtual_classroom_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

-- Resources
CREATE TABLE public.virtual_classroom_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Q&A
CREATE TABLE public.virtual_classroom_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_answered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.virtual_classroom_qa_votes (
    qa_id UUID NOT NULL REFERENCES public.virtual_classroom_qa(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY(qa_id, user_id)
);

-- Attendance Logs
CREATE TABLE public.virtual_classroom_attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at TIMESTAMPTZ
);

-- Feedback
CREATE TABLE public.virtual_classroom_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(classroom_id, user_id)
);

-- Add AI fields to virtual_classrooms
ALTER TABLE public.virtual_classrooms
ADD COLUMN ai_summary TEXT,
ADD COLUMN ai_action_items JSONB,
ADD COLUMN ai_flashcards JSONB,
ADD COLUMN transcript_url TEXT,
ADD COLUMN whiteboard_state JSONB;

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_qa;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_qa_votes;

-- Row Level Security
ALTER TABLE public.virtual_classroom_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_qa_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_feedback ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and create (we handle access logic via frontend/RPC if needed, but for simplicity we allow read all)
CREATE POLICY "Allow read all" ON public.virtual_classroom_polls FOR SELECT USING (true);
CREATE POLICY "Allow read all" ON public.virtual_classroom_poll_votes FOR SELECT USING (true);
CREATE POLICY "Allow read all" ON public.virtual_classroom_resources FOR SELECT USING (true);
CREATE POLICY "Allow read all" ON public.virtual_classroom_qa FOR SELECT USING (true);
CREATE POLICY "Allow read all" ON public.virtual_classroom_qa_votes FOR SELECT USING (true);
CREATE POLICY "Allow read all" ON public.virtual_classroom_attendance_log FOR SELECT USING (true);
CREATE POLICY "Allow read all" ON public.virtual_classroom_feedback FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_polls FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_qa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_qa_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_attendance_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated insert" ON public.virtual_classroom_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update policies (only creators can update)
CREATE POLICY "Allow creator update" ON public.virtual_classroom_polls FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow creator update" ON public.virtual_classroom_qa FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow creator update" ON public.virtual_classroom_attendance_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Host can update qa" ON public.virtual_classroom_qa FOR UPDATE USING (
    EXISTS (SELECT 1 FROM virtual_classrooms c WHERE c.id = classroom_id AND c.host_id = auth.uid())
);
