-- 1. Fix Privacy Leak: Enforce RLS on virtual_classrooms for SELECT
-- First, drop any existing overly permissive SELECT policy if one exists
DROP POLICY IF EXISTS "Allow read all" ON public.virtual_classrooms;
DROP POLICY IF EXISTS "Respect classroom visibility" ON public.virtual_classrooms;

-- Create strict visibility policy
CREATE POLICY "Respect classroom visibility" ON public.virtual_classrooms FOR SELECT USING (
  visibility = 'public' 
  OR host_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM virtual_classroom_participants WHERE classroom_id = id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM virtual_classroom_invites WHERE classroom_id = id AND invitee_id = auth.uid())
);

-- Ensure RLS is actually enabled on the table
ALTER TABLE public.virtual_classrooms ENABLE ROW LEVEL SECURITY;

-- 2. Fix Monetization Bypass: Enforce payment check in join_virtual_classroom RPC
CREATE OR REPLACE FUNCTION public.join_virtual_classroom(_classroom_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  _max INT; 
  _cnt INT; 
  _new_status TEXT; 
  _title TEXT;
  _is_paid BOOLEAN;
  _price NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT max_participants, participant_count, title, is_paid, price 
    INTO _max, _cnt, _title, _is_paid, _price
    FROM virtual_classrooms WHERE id = _classroom_id FOR UPDATE;
    
  IF _max IS NULL THEN RAISE EXCEPTION 'Classroom not found'; END IF;
  
  -- If full, go to waitlist
  IF _cnt >= _max THEN
    _new_status := 'waitlisted';
  ELSE
    _new_status := 'attending';
    
    -- MONETIZATION FIX: Verify payment if it's a paid classroom and the user is actually getting a spot
    IF _is_paid AND _price > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM virtual_classroom_transactions 
        WHERE classroom_id = _classroom_id 
          AND user_id = auth.uid() 
          AND status = 'completed'
      ) THEN
        RAISE EXCEPTION 'Payment required to join this session';
      END IF;
    END IF;
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
