
-- ============ STUDY GROUP INVITES ============
CREATE TABLE public.study_group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 25,
  uses INT NOT NULL DEFAULT 0,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sgi_group ON public.study_group_invites(group_id);
CREATE INDEX idx_sgi_token ON public.study_group_invites(token);

GRANT SELECT ON public.study_group_invites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_group_invites TO authenticated;
GRANT ALL ON public.study_group_invites TO service_role;

ALTER TABLE public.study_group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invite by token" ON public.study_group_invites
  FOR SELECT USING (true);
CREATE POLICY "Group owners/moderators create invites" ON public.study_group_invites
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = study_group_invites.group_id AND user_id = auth.uid()
        AND role IN ('owner','moderator')
    )
  );
CREATE POLICY "Creator can revoke" ON public.study_group_invites
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete" ON public.study_group_invites
  FOR DELETE USING (auth.uid() = created_by);

-- ============ EVENT ATTENDANCE ============
CREATE TABLE public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'self' CHECK (method IN ('self','organizer','qr','auto')),
  notes TEXT,
  UNIQUE(event_id, user_id)
);
CREATE INDEX idx_event_att_event ON public.event_attendance(event_id);
CREATE INDEX idx_event_att_user ON public.event_attendance(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendance TO authenticated;
GRANT ALL ON public.event_attendance TO service_role;

ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members & organizers can view attendance" ON public.event_attendance
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.events WHERE id = event_attendance.event_id AND organizer_id = auth.uid()
    )
  );
CREATE POLICY "Users can check themselves in" ON public.event_attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers can insert attendance" ON public.event_attendance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_attendance.event_id AND organizer_id = auth.uid())
  );
CREATE POLICY "Organizers can update attendance" ON public.event_attendance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_attendance.event_id AND organizer_id = auth.uid())
  );

-- ============ CLASSROOM MESSAGES ============
CREATE TABLE public.classroom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  parent_id UUID REFERENCES public.classroom_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cm_room ON public.classroom_messages(classroom_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classroom_messages TO authenticated;
GRANT ALL ON public.classroom_messages TO service_role;

ALTER TABLE public.classroom_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages" ON public.classroom_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.virtual_classroom_participants
      WHERE classroom_id = classroom_messages.classroom_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.virtual_classrooms WHERE id = classroom_messages.classroom_id AND host_id = auth.uid()
    )
  );
CREATE POLICY "Participants can post" ON public.classroom_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM public.virtual_classroom_participants WHERE classroom_id = classroom_messages.classroom_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.virtual_classrooms WHERE id = classroom_messages.classroom_id AND host_id = auth.uid())
    )
  );
CREATE POLICY "Author can delete own message" ON public.classroom_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ============ CLASSROOM MESSAGE REACTIONS ============
CREATE TABLE public.classroom_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.classroom_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX idx_cmr_msg ON public.classroom_message_reactions(message_id);

GRANT SELECT, INSERT, DELETE ON public.classroom_message_reactions TO authenticated;
GRANT ALL ON public.classroom_message_reactions TO service_role;

ALTER TABLE public.classroom_message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view reactions" ON public.classroom_message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classroom_messages m
      JOIN public.virtual_classrooms c ON c.id = m.classroom_id
      WHERE m.id = classroom_message_reactions.message_id AND (
        c.host_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.virtual_classroom_participants p
          WHERE p.classroom_id = c.id AND p.user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can react" ON public.classroom_message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unreact" ON public.classroom_message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============ RPCs ============

-- create_group_invite
CREATE OR REPLACE FUNCTION public.create_group_invite(
  _group_id UUID, _role TEXT DEFAULT 'member', _expires_in_hours INT DEFAULT 72, _max_uses INT DEFAULT 25
) RETURNS TABLE(id UUID, token TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tok TEXT; _id UUID; _exp TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.study_group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND role IN ('owner','moderator')
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  _tok := encode(gen_random_bytes(18), 'hex');
  _exp := now() + (_expires_in_hours || ' hours')::interval;
  INSERT INTO public.study_group_invites(group_id, token, role, created_by, expires_at, max_uses)
    VALUES (_group_id, _tok, _role, auth.uid(), _exp, _max_uses)
    RETURNING study_group_invites.id INTO _id;
  RETURN QUERY SELECT _id, _tok, _exp;
END $$;

-- redeem_group_invite
CREATE OR REPLACE FUNCTION public.redeem_group_invite(_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _gid UUID; _role TEXT; _exp TIMESTAMPTZ; _uses INT; _max INT; _revoked BOOLEAN; _lim INT; _cnt INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT group_id, role, expires_at, uses, max_uses, revoked
    INTO _gid, _role, _exp, _uses, _max, _revoked
    FROM public.study_group_invites WHERE token = _token FOR UPDATE;
  IF _gid IS NULL THEN RAISE EXCEPTION 'Invalid invite'; END IF;
  IF _revoked THEN RAISE EXCEPTION 'Invite revoked'; END IF;
  IF _exp < now() THEN RAISE EXCEPTION 'Invite expired'; END IF;
  IF _uses >= _max THEN RAISE EXCEPTION 'Invite used up'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = _gid AND user_id = auth.uid()) THEN
    SELECT member_limit, member_count INTO _lim, _cnt FROM public.study_groups WHERE id = _gid FOR UPDATE;
    IF _cnt >= _lim THEN RAISE EXCEPTION 'Group full'; END IF;
    INSERT INTO public.study_group_members(group_id, user_id, role) VALUES (_gid, auth.uid(), _role);
    UPDATE public.study_groups SET member_count = member_count + 1 WHERE id = _gid;
  END IF;
  UPDATE public.study_group_invites SET uses = uses + 1 WHERE token = _token;
  RETURN _gid;
END $$;

-- check_in_event (self) and organizer check-in
CREATE OR REPLACE FUNCTION public.check_in_event(_event_id UUID, _user_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _target UUID; _aid UUID; _is_org BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _target := COALESCE(_user_id, auth.uid());
  SELECT (organizer_id = auth.uid()) INTO _is_org FROM public.events WHERE id = _event_id;
  IF _target <> auth.uid() AND NOT COALESCE(_is_org, false) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  INSERT INTO public.event_attendance(event_id, user_id, method)
    VALUES (_event_id, _target, CASE WHEN _is_org THEN 'organizer' ELSE 'self' END)
    ON CONFLICT (event_id, user_id) DO UPDATE SET checked_in_at = now()
    RETURNING id INTO _aid;
  RETURN _aid;
END $$;

-- toggle_classroom_reaction
CREATE OR REPLACE FUNCTION public.toggle_classroom_reaction(_message_id UUID, _emoji TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.classroom_message_reactions WHERE message_id = _message_id AND user_id = auth.uid() AND emoji = _emoji) THEN
    DELETE FROM public.classroom_message_reactions WHERE message_id = _message_id AND user_id = auth.uid() AND emoji = _emoji;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO public.classroom_message_reactions(message_id, user_id, emoji) VALUES (_message_id, auth.uid(), _emoji);
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

-- ============ NOTIFICATION TRIGGERS ============

-- Notify on RSVP confirmation (to user) and to organizer
CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title TEXT; _org UUID;
BEGIN
  SELECT title, organizer_id INTO _title, _org FROM public.events WHERE id = NEW.event_id;
  INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
    VALUES (NEW.user_id, 'event', 'Registration confirmed',
      'You are registered for ' || COALESCE(_title,'an event'),
      '/events', jsonb_build_object('event_id', NEW.event_id));
  IF _org IS NOT NULL AND _org <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
      VALUES (_org, 'event', 'New registration',
        'A user just registered for ' || COALESCE(_title,'your event'),
        '/events', jsonb_build_object('event_id', NEW.event_id, 'attendee_id', NEW.user_id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_event_registration ON public.event_registrations;
CREATE TRIGGER trg_notify_event_registration AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_registration();

-- Notify all registrants when event updated (time / venue / status)
CREATE OR REPLACE FUNCTION public.notify_event_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.starts_at IS DISTINCT FROM OLD.starts_at)
     OR (NEW.venue IS DISTINCT FROM OLD.venue)
     OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
    SELECT r.user_id, 'event', 'Event updated: ' || NEW.title,
      CASE
        WHEN NEW.status IS DISTINCT FROM OLD.status THEN 'Status changed to ' || NEW.status
        WHEN NEW.starts_at IS DISTINCT FROM OLD.starts_at THEN 'Time updated'
        ELSE 'Venue updated'
      END,
      '/events', jsonb_build_object('event_id', NEW.id)
    FROM public.event_registrations r WHERE r.event_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_event_update ON public.events;
CREATE TRIGGER trg_notify_event_update AFTER UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_update();

-- Notify on classroom message (host gets pinged when not author)
CREATE OR REPLACE FUNCTION public.notify_classroom_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _host UUID; _title TEXT;
BEGIN
  SELECT host_id, title INTO _host, _title FROM public.virtual_classrooms WHERE id = NEW.classroom_id;
  IF _host IS NOT NULL AND _host <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
      VALUES (_host, 'message', 'New classroom message',
        'New message in ' || COALESCE(_title,'classroom'),
        '/virtual-classroom', jsonb_build_object('classroom_id', NEW.classroom_id, 'message_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_classroom_message ON public.classroom_messages;
CREATE TRIGGER trg_notify_classroom_message AFTER INSERT ON public.classroom_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_classroom_message();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_invites;
