import { useCallback, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface EventRow {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  eventType: string;
  bannerImage: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isVirtual: boolean;
  venue: string;
  hostedBy: any;
  hostName: string;
  status: string;
  registrationRequired: boolean;
  registrationDeadline: string | null;
  capacity: number | null;
  registrationCount?: number;
  teamSize?: { min: number, max: number };
  prizes?: string[];
  agenda?: any[];
  rulesDocument?: string | null;
  tags: string[];
  createdAt: string;
}

export const useEvents = (typeFilter: string = "all", timeFilter: string = "upcoming", searchQuery: string = "", month: string = "") => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [thisWeekEvents, setThisWeekEvents] = useState<EventRow[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('live');

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const qs = new URLSearchParams();
      if (typeFilter !== "all") qs.append('type', typeFilter);
      if (timeFilter !== "all") qs.append('filter', timeFilter);
      if (searchQuery) qs.append('search', searchQuery);
      if (month) qs.append('month', month);
      
      const [res, twRes] = await Promise.all([
        fetch(`${API_URL}/api/events?${qs.toString()}`),
        fetch(`${API_URL}/api/events?filter=this_week`)
      ]);
      
      let data = await res.json();
      data = data.map((e: any) => ({ ...e, id: e._id }));
      setEvents(data);

      let twData = await twRes.json();
      twData = twData.map((e: any) => ({ ...e, id: e._id }));
      setThisWeekEvents(twData);

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
  }, [typeFilter, timeFilter, searchQuery, month]);

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

  return { events, thisWeekEvents, myRegistrations, loading, status, register, cancel, createEvent, refetch: fetchAll };
};
