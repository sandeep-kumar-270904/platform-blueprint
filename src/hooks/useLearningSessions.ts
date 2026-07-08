import { useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface LearningSessionRow {
  id: string;
  _id?: string;
  host_id: string;
  title: string;
  description: string | null;
  session_type: string;
  topic: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  participant_count: number;
  price: number;
  status: string;
  video_link: string | null;
  recording_url: string | null;
  host_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
  is_rsvped?: boolean;
}

export const useLearningSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LearningSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/learning-sessions`, { headers });
      if (res.ok) {
        let data = await res.json();
        data = data.map((s: any) => ({ ...s, id: s._id }));
        setSessions(data as LearningSessionRow[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSessions();
    
    const socket = io(API_URL);
    socket.on('learning-sessions-public', () => fetchSessions());

    return () => {
      socket.disconnect();
    };
  }, [fetchSessions]);

  const rsvp = async (sessionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return { error: "Not authenticated" };
    
    const res = await fetch(`${API_URL}/api/learning-sessions/${sessionId}/rsvp`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const err = await res.json();
      return err;
    }
    
    await fetchSessions();
    return null; // no error
  };

  const cancelRsvp = async (sessionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return { error: "Not authenticated" };
    
    const res = await fetch(`${API_URL}/api/learning-sessions/${sessionId}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const err = await res.json();
      return err;
    }
    
    await fetchSessions();
    return null;
  };

  return { sessions, loading, refetch: fetchSessions, rsvp, cancelRsvp };
};
