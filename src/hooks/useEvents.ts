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

export const useEvents = (typeFilter: string = "all", timeFilter: string = "upcoming", searchQuery: string = "", month: string = "", page: number = 1, modeFilter: string = "all", sortOrder: string = "upcoming") => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [thisWeekEvents, setThisWeekEvents] = useState<EventRow[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [myBookmarks, setMyBookmarks] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
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
      qs.append('page', page.toString());
      if (modeFilter !== "all") qs.append('mode', modeFilter);
      if (sortOrder !== "upcoming") qs.append('sort', sortOrder);
      
      const [res, twRes] = await Promise.all([
        fetch(`${API_URL}/api/events?${qs.toString()}`),
        fetch(`${API_URL}/api/events?filter=this_week`)
      ]);
      
      const data = await res.json();
      const eventsArray = Array.isArray(data.events) ? data.events : (Array.isArray(data) ? data : []);
      const mappedEvents = eventsArray.map((e: any) => ({ ...e, id: e._id }));
      setEvents(mappedEvents);
      if (data.total !== undefined) {
        setPagination({ total: data.total, page: data.page, pages: data.pages });
      }

      const twData = await twRes.json();
      const twEventsArray = Array.isArray(twData.events) ? twData.events : (Array.isArray(twData) ? twData : []);
      const mappedTwEvents = twEventsArray.map((e: any) => ({ ...e, id: e._id }));
      setThisWeekEvents(mappedTwEvents);

      if (token) {
        const [regsRes, booksRes] = await Promise.all([
          fetch(`${API_URL}/api/users/me/events/registered`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/events/bookmarks/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (regsRes.ok) {
          const data = await regsRes.json();
          const allRegs = [...(data.upcoming || []), ...(data.past || [])];
          setMyRegistrations(new Set(allRegs.map((r: any) => r._id)));
        }
        if (booksRes.ok) {
          const bookmarkedIds = await booksRes.json();
          setMyBookmarks(new Set(bookmarkedIds));
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, timeFilter, searchQuery, month, page, modeFilter, sortOrder]);

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

  const toggleBookmark = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return toast({ title: "Sign in required", variant: "destructive" });
    const isBookmarked = myBookmarks.has(eventId);
    
    // Optimistic update
    setMyBookmarks(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle bookmark');
    } catch (error: any) {
      // Revert optimistic update
      setMyBookmarks(prev => {
        const next = new Set(prev);
        if (isBookmarked) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  return { events, thisWeekEvents, myRegistrations, myBookmarks, pagination, loading, status, register, cancel, createEvent, toggleBookmark, refetch: fetchAll };
};
