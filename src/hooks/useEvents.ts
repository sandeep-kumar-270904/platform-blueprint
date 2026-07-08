import { useCallback, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface EventRow {
  _id?: string;
  id?: string;
  organizer_id: string;
  title: string;
  description: string;
  type: string;
  mode: string;
  venue: string | null;
  starts_at: string;
  ends_at: string | null;
  registration_deadline: string | null;
  capacity: number;
  registration_count: number;
  prize: string | null;
  tags: string[];
  banner_url: string | null;
  featured: boolean;
  status: string;
}

export const useEvents = (typeFilter: string = "all") => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('live');

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const qs = new URLSearchParams();
      if (typeFilter !== "all") qs.append('type', typeFilter);
      
      const res = await fetch(`${API_URL}/api/events?${qs.toString()}`);
      let data = await res.json();
      data = data.map((e: any) => ({ ...e, id: e._id }));
      setEvents(data);

      if (token) {
        const regsRes = await fetch(`${API_URL}/api/events/registrations/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (regsRes.ok) {
          const regs = await regsRes.json();
          setMyRegistrations(new Set(regs.map((r: any) => r.event_id)));
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchAll();

    const socket = io(API_URL);
    socket.on('event_created', () => fetchAll());
    socket.on('event_updated', () => fetchAll());

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  const register = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return toast({ title: "Sign in required", variant: "destructive" });
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }
      toast({ title: "Registered!" });
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    }
  };

  const cancel = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Cancel failed');
      }
      toast({ title: "Registration cancelled" });
    } catch (error: any) {
      toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
    }
  };

  const createEvent = async (payload: Partial<EventRow>) => {
    const token = localStorage.getItem('token');
    if (!token) return toast({ title: "Sign in required", variant: "destructive" });
    try {
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create event');
      }
      toast({ title: "Event created" });
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  return { events, myRegistrations, loading, status, register, cancel, createEvent, refetch: fetchAll };
};
