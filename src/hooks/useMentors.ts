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

export const useMentors = (filters?: { search?: string; expertise?: string | null; isFree?: string; minRating?: string; sort?: string; page?: number }) => {
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      let query = `${API_URL}/api/mentors?`;
      if (filters?.search) query += `search=${encodeURIComponent(filters.search)}&`;
      if (filters?.expertise) query += `expertise=${encodeURIComponent(filters.expertise)}&`;
      if (filters?.isFree) query += `isFree=${filters.isFree}&`;
      if (filters?.minRating) query += `minRating=${filters.minRating}&`;
      if (filters?.sort) query += `sort=${filters.sort}&`;
      if (filters?.page) query += `page=${filters.page}&`;

      const res = await fetch(query);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.mentors.map((m: any) => ({ ...m, id: m._id }));
        setMentors(mapped);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.expertise, filters?.isFree, filters?.minRating, filters?.sort, filters?.page]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return { mentors, loading, total, refetch: fetchMentors };
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
