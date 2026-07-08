import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface MentorRow {
  _id?: string;
  id?: string;
  user_id: string;
  title: string;
  company: string | null;
  bio: string | null;
  expertise: string[];
  languages: string[];
  price_per_hour: number;
  rating: number;
  reviews_count: number;
  sessions_count: number;
  verified: boolean;
  availability_text: string | null;
  is_active: boolean;
  profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

export interface AvailabilitySlot {
  _id?: string;
  id?: string;
  mentor_id: string;
  starts_at: string;
  ends_at: string;
  is_booked: boolean;
}

export const useMentors = () => {
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentors = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/mentors`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((m: any) => ({ ...m, id: m._id }));
        setMentors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return { mentors, loading, refetch: fetchMentors };
};

export const useMentorAvailability = (mentorId: string | null) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!mentorId) return setSlots([]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mentors/${mentorId}/availability`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((s: any) => ({ ...s, id: s._id }));
        setSlots(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchSlots();

    if (!mentorId) return;

    const socket = io(API_URL);
    socket.on('mentor_slots_updated', (updatedMentorId) => {
      if (updatedMentorId === mentorId) fetchSlots();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchSlots, mentorId]);

  return { slots, loading, refetch: fetchSlots };
};
