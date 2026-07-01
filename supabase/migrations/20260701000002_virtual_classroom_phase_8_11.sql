-- Phase 8-11: Monetization, Safety, and Settings Schema

-- 1. Extend virtual_classrooms for Monetization and Settings
ALTER TABLE public.virtual_classrooms
ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN refund_policy TEXT,
ADD COLUMN room_settings JSONB NOT NULL DEFAULT '{"chat_enabled": true, "is_locked": false, "require_hand_raise": false, "mute_all": false}'::jsonb;

-- 2. Extend profiles for Premium Hosting and Safety
ALTER TABLE public.profiles
ADD COLUMN hosting_tier TEXT NOT NULL DEFAULT 'free' CHECK (hosting_tier IN ('free', 'premium')),
ADD COLUMN safety_status TEXT NOT NULL DEFAULT 'good' CHECK (safety_status IN ('good', 'warned', 'suspended'));

-- 3. Monetization Transactions
CREATE TABLE public.virtual_classroom_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    type TEXT NOT NULL DEFAULT 'payment' CHECK (type IN ('payment', 'payout')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Trust & Safety Reports
CREATE TABLE public.virtual_classroom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES public.virtual_classrooms(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. User Blocking
CREATE TABLE public.user_blocks (
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY(blocker_id, blocked_id)
);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;

-- RLS Policies
ALTER TABLE public.virtual_classroom_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classroom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.virtual_classroom_transactions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.virtual_classrooms c WHERE c.id = classroom_id AND c.host_id = auth.uid()));
CREATE POLICY "Users can insert transactions" ON public.virtual_classroom_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.virtual_classroom_transactions FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.virtual_classrooms c WHERE c.id = classroom_id AND c.host_id = auth.uid()));

CREATE POLICY "Users can view their own reports" ON public.virtual_classroom_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can insert reports" ON public.virtual_classroom_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their blocks" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can insert blocks" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete blocks" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);
