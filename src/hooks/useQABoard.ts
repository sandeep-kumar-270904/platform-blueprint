import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface QAQuestion {
  _id?: string;
  id?: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  upvotes: number;
  answer_count: number;
  view_count: number;
  is_resolved: boolean;
  is_pinned: boolean;
  created_at?: string;
  createdAt?: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export interface QAAnswer {
  _id?: string;
  id?: string;
  question_id: string;
  user_id: string;
  body: string;
  upvotes: number;
  is_accepted: boolean;
  created_at?: string;
  createdAt?: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export function useQuestions(category?: string, search?: string, unanswered?: boolean) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const fetchQuestions = useCallback(async () => {
    const currentReq = ++reqId.current;
    try {
      const qs = new URLSearchParams();
      if (category) qs.append('category', category);
      if (search) qs.append('search', search);
      if (unanswered) qs.append('unanswered', 'true');
      
      const res = await fetch(`${API_URL}/api/qa/questions?${qs.toString()}`);
      if (currentReq !== reqId.current) return;
      
      let data = await res.json();
      data = data.map((q: any) => ({ ...q, id: q._id, created_at: q.createdAt }));
      setQuestions(data);
    } catch (err) {
      if (currentReq !== reqId.current) return;
      console.error(err);
      toast.error("Failed to load QA questions");
    } finally {
      if (currentReq === reqId.current) setLoading(false);
    }
  }, [category, search, unanswered]);

  useEffect(() => {
    setLoading(true);
    fetchQuestions();
    
    const socket = io(API_URL);
    socket.on('qa_question_created', (newQuestion) => {
      newQuestion.id = newQuestion._id;
      newQuestion.created_at = newQuestion.createdAt;
      setQuestions(prev => [newQuestion, ...prev]);
    });
    socket.on('qa_question_updated', () => fetchQuestions());
    
    return () => {
      socket.disconnect();
    };
  }, [fetchQuestions]);

  const handleVote = async (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/qa/questions/${id}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 1 })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to vote');
      }
    } catch (err: any) {
      toast.error(err.message);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, upvotes: q.upvotes - 1 } : q));
    }
  };

  return { questions, loading, status: 'live', refetch: fetchQuestions, handleVote };
}

export async function createQuestion(input: { title: string; body: string; category: string; tags: string[] }) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/api/qa/questions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to create question');
    toast.success("Question posted");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function incrementQuestionViews(questionId: string) {
  try {
    await fetch(`${API_URL}/api/qa/questions/${questionId}/view`, { method: 'POST' });
  } catch (err) {}
}

export function useAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<QAAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnswers = useCallback(async () => {
    if (!questionId) { setAnswers([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/qa/questions/${questionId}/answers`);
      let data = await res.json();
      data = data.map((a: any) => ({ ...a, id: a._id, created_at: a.createdAt }));
      setAnswers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load answers");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    setLoading(true);
    fetchAnswers();
    
    if (!questionId) return;

    const socket = io(API_URL);
    socket.emit('join_qa_question', questionId);
    
    socket.on('qa_answer_created', (newAnswer) => {
      newAnswer.id = newAnswer._id;
      newAnswer.created_at = newAnswer.createdAt;
      setAnswers(prev => [...prev, newAnswer]);
    });
    
    socket.on('qa_answer_updated', () => fetchAnswers());
    
    return () => {
      socket.emit('leave_qa_question', questionId);
      socket.disconnect();
    };
  }, [questionId, fetchAnswers]);

  const handleVote = async (id: string) => {
    setAnswers(prev => prev.map(a => a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/qa/answers/${id}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 1 })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to vote');
      }
    } catch (err: any) {
      toast.error(err.message);
      setAnswers(prev => prev.map(a => a.id === id ? { ...a, upvotes: a.upvotes - 1 } : a));
    }
  };

  return { answers, loading, status: 'live', refetch: fetchAnswers, handleVote };
}

export async function postAnswer(questionId: string, body: string) {
  if (!body.trim()) { toast.error("Answer cannot be empty"); return null; }
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/api/qa/questions/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() })
    });
    if (!res.ok) throw new Error('Failed to post answer');
    toast.success("Answer posted");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}
