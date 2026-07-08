import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface BookingRow {
  _id?: string;
  id?: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  price_paid: number;
  status: string;
  video_link: string | null;
  notes: string | null;
  mentor?: { title: string; company: string | null; user_id: string } | null;
  mentor_profile?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export const useMyBookings = (userId: string | null | undefined) => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/mentors/bookings/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();
        data = data.map((b: any) => ({ ...b, id: b._id }));
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();

    if (!userId) return;

    const socket = io(API_URL);
    socket.on(`my_bookings_updated_${userId}`, () => fetchBookings());

    return () => {
      socket.disconnect();
    };
  }, [fetchBookings, userId]);

  const cancel = async (bookingId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return new Error('Unauthorized');
    
    try {
      const res = await fetch(`${API_URL}/api/mentors/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to cancel');
      }
      toast.success("Booking cancelled");
      return null; // success
    } catch (err: any) {
      toast.error(err.message);
      return err;
    }
  };

  const bookSlot = async (slotId: string, mentorId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error("Sign in required"); return; }
    
    try {
      const res = await fetch(`${API_URL}/api/mentors/bookings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, mentor_id: mentorId })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to book slot');
      }
      toast.success("Slot booked successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return { bookings, loading, refetch: fetchBookings, cancel, bookSlot };
};
