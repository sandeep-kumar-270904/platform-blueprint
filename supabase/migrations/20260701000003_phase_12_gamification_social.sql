-- Phase 12 Gamification & Social Schema

-- 1. Followers
CREATE TABLE public.user_follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see who they follow" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;

-- 2. Invites
CREATE TABLE public.virtual_classroom_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(classroom_id, invitee_id)
);

ALTER TABLE public.virtual_classroom_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their invites" ON public.virtual_classroom_invites FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);
CREATE POLICY "Users can send invites" ON public.virtual_classroom_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users can update their own invite status" ON public.virtual_classroom_invites FOR UPDATE USING (auth.uid() = invitee_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_invites;

-- 3. Unified Activity View
CREATE OR REPLACE VIEW public.user_activity_feed AS
SELECT 
    'note' as activity_type,
    id as reference_id,
    user_id,
    title as description,
    created_at
FROM public.notes
UNION ALL
SELECT 
    'idea' as activity_type,
    id as reference_id,
    user_id,
    title as description,
    created_at
FROM public.ideas
UNION ALL
SELECT 
    'classroom_message' as activity_type,
    id as reference_id,
    user_id,
    content as description,
    created_at
FROM public.virtual_classroom_messages;

-- 4. Gamification RPC Function
CREATE OR REPLACE FUNCTION public.get_user_gamification_stats(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notes_count INT;
    ideas_count INT;
    teams_count INT;
    hosted_count INT;
    attended_count INT;
    longest_streak INT := 0;
    current_streak INT := 0;
    result JSONB;
BEGIN
    SELECT count(*) INTO notes_count FROM public.notes WHERE user_id = target_user_id;
    SELECT count(*) INTO ideas_count FROM public.ideas WHERE user_id = target_user_id;
    SELECT count(*) INTO teams_count FROM public.team_members WHERE user_id = target_user_id;
    SELECT count(*) INTO hosted_count FROM public.virtual_classrooms WHERE host_id = target_user_id;
    SELECT count(*) INTO attended_count FROM public.virtual_classroom_participants WHERE user_id = target_user_id;

    WITH activity_dates AS (
        SELECT DATE(created_at) as act_date FROM public.quiz_attempts WHERE user_id = target_user_id
        UNION
        SELECT DATE(joined_at) as act_date FROM public.virtual_classroom_participants WHERE user_id = target_user_id
    ),
    ordered_dates AS (
        SELECT act_date, 
               act_date - (ROW_NUMBER() OVER(ORDER BY act_date))::INT AS grp
        FROM activity_dates
    ),
    streak_groups AS (
        SELECT grp, MIN(act_date) as start_date, MAX(act_date) as end_date, COUNT(*) as streak_length
        FROM ordered_dates
        GROUP BY grp
    )
    SELECT COALESCE(MAX(streak_length), 0) INTO longest_streak FROM streak_groups;

    SELECT COALESCE(streak_length, 0) INTO current_streak 
    FROM streak_groups 
    WHERE end_date >= CURRENT_DATE - INTERVAL '1 day' 
    ORDER BY end_date DESC LIMIT 1;

    result = jsonb_build_object(
        'notes_count', notes_count,
        'ideas_count', ideas_count,
        'teams_count', teams_count,
        'hosted_count', hosted_count,
        'attended_count', attended_count,
        'current_streak', current_streak,
        'longest_streak', longest_streak,
        'badges', jsonb_build_object(
            'knowledge_sharer', notes_count >= 5,
            'innovator', ideas_count >= 3,
            'team_player', teams_count >= 2,
            'streak_master', current_streak >= 7,
            'classroom_host', hosted_count >= 1,
            'active_learner', attended_count >= 10
        )
    );

    RETURN result;
END;
$$;
