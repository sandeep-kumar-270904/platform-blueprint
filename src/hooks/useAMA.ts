import { useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AMASessionRow {
  id: string;
  _id?: string;
  mentor_id: string;
  title: string;
  description: string | null;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  max_participants: number;
  participant_count: number;
  is_active: boolean;
  mentor_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
  mentor_meta?: { title: string; company: string | null };
}

export interface AMAQuestionRow {
  id: string;
  _id?: string;
  session_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  upvotes: number;
  is_answered: boolean;
  is_pinned: boolean;
  created_at: string;
  user_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
  has_voted?: boolean;
}

export const useAMASessions = () => {
  const [sessions, setSessions] = useState<AMASessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/amas/sessions`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((s: any) => ({ ...s, id: s._id }));
        setSessions(data);
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
    
    // We could use socket here for 'ama-sessions-public'
    const socket = io(API_URL);
    socket.on('ama-sessions-public', () => fetchSessions());
    
    return () => { socket.disconnect(); };
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
};

export const useAMAQuestions = (sessionId: string | null, currentUserId: string | null | undefined) => {
  const [questions, setQuestions] = useState<AMAQuestionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!sessionId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/amas/sessions/${sessionId}/questions`, { headers });
      if (res.ok) {
        let data = await res.json();
        data = data.map((q: any) => ({ ...q, id: q._id }));
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, currentUserId]);

  useEffect(() => {
    fetchQuestions();
    
    if (sessionId) {
      const socket = io(API_URL);
      socket.on(`ama-q-${sessionId}`, () => fetchQuestions());
      return () => { socket.disconnect(); };
    }
  }, [fetchQuestions, sessionId]);

  const askQuestion = async (question: string) => {
    if (!sessionId || !currentUserId) return { error: new Error("Not signed in") };
    const trimmed = question.trim();
    if (trimmed.length < 5 || trimmed.length > 500) return { error: new Error("Question must be 5–500 chars") };
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/amas/sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: trimmed })
      });
      if (!res.ok) return { error: new Error("Failed to post question") };
      
      await fetchQuestions();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const toggleVote = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/amas/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return { error: new Error("Failed to vote") };
      
      await fetchQuestions();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  return { questions, loading, refetch: fetchQuestions, askQuestion, toggleVote };
};
