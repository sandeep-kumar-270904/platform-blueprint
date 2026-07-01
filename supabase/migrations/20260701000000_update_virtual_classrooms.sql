-- Add new columns to virtual_classrooms
ALTER TABLE public.virtual_classrooms 
ADD COLUMN join_code TEXT UNIQUE,
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'invite-only')),
ADD COLUMN type TEXT NOT NULL DEFAULT 'interactive' CHECK (type IN ('interactive', 'webinar'));

-- We need a default join code for existing records before making it NOT NULL if there are any.
UPDATE public.virtual_classrooms SET join_code = substr(md5(random()::text), 1, 8) WHERE join_code IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.virtual_classrooms ALTER COLUMN join_code SET NOT NULL;

-- Add new columns to virtual_classroom_participants
ALTER TABLE public.virtual_classroom_participants
ADD COLUMN role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),
ADD COLUMN status TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'waitlisted', 'removed'));

-- Update join logic to support waitlist and notifications
CREATE OR REPLACE FUNCTION public.join_virtual_classroom(_classroom_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _max INT; _cnt INT; _new_status TEXT; _title TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT max_participants, participant_count, title INTO _max, _cnt, _title
    FROM virtual_classrooms WHERE id = _classroom_id FOR UPDATE;
    
  IF _max IS NULL THEN RAISE EXCEPTION 'Classroom not found'; END IF;
  
  -- If full, go to waitlist
  IF _cnt >= _max THEN
    _new_status := 'waitlisted';
  ELSE
    _new_status := 'attending';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM virtual_classroom_participants WHERE classroom_id = _classroom_id AND user_id = auth.uid()) THEN
    INSERT INTO virtual_classroom_participants(classroom_id, user_id, status) VALUES (_classroom_id, auth.uid(), _new_status);
    
    IF _new_status = 'attending' THEN
      UPDATE virtual_classrooms SET participant_count = participant_count + 1 WHERE id = _classroom_id;
      
      INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
      VALUES (auth.uid(), 'classroom', 'RSVP Confirmed', 'You have successfully RSVP''d to ' || _title, '/virtual-classroom', jsonb_build_object('classroom_id', _classroom_id));
    ELSE
      INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
      VALUES (auth.uid(), 'classroom', 'Waitlisted', 'You are on the waitlist for ' || _title, '/virtual-classroom', jsonb_build_object('classroom_id', _classroom_id));
    END IF;
  END IF;
END $$;

-- Update leave logic to promote waitlisted users and notify
CREATE OR REPLACE FUNCTION public.leave_virtual_classroom(_classroom_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _was_attending BOOLEAN; _next_user UUID; _title TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT title INTO _title FROM virtual_classrooms WHERE id = _classroom_id;
  
  -- Check if user was actually attending
  SELECT (status = 'attending') INTO _was_attending 
  FROM virtual_classroom_participants 
  WHERE classroom_id = _classroom_id AND user_id = auth.uid();

  IF FOUND THEN
    DELETE FROM virtual_classroom_participants WHERE classroom_id = _classroom_id AND user_id = auth.uid();
    
    IF _was_attending THEN
      -- Promote the first waitlisted user
      SELECT user_id INTO _next_user FROM virtual_classroom_participants
      WHERE classroom_id = _classroom_id AND status = 'waitlisted'
      ORDER BY joined_at ASC LIMIT 1;

      IF _next_user IS NOT NULL THEN
        UPDATE virtual_classroom_participants SET status = 'attending' WHERE classroom_id = _classroom_id AND user_id = _next_user;
        
        -- Notify the promoted user
        INSERT INTO public.notifications(user_id, type, title, message, action_url, metadata)
        VALUES (_next_user, 'classroom', 'Waitlist Promotion', 'A spot opened up! You are now attending ' || _title, '/virtual-classroom', jsonb_build_object('classroom_id', _classroom_id));
      ELSE
        UPDATE virtual_classrooms SET participant_count = participant_count - 1 WHERE id = _classroom_id;
      END IF;
    END IF;
  END IF;
END $$;
