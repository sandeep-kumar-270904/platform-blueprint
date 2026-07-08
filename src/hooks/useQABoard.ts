import { useState, useCallback, useEffect } from "react";
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

export function useQuestions(category?: string) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (category) qs.append('category', category);
      
      const res = await fetch(`${API_URL}/api/qa/questions?${qs.toString()}`);
      let data = await res.json();
      data = data.map((q: any) => ({ ...q, id: q._id, created_at: q.createdAt }));
      setQuestions(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load QA questions");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setLoading(true);
    fetchQuestions();
    
    const socket = io(API_URL);
    socket.on('qa_question_created', () => fetchQuestions());
    socket.on('qa_question_updated', () => fetchQuestions());
    
    return () => {
      socket.disconnect();
    };
  }, [fetchQuestions]);

  return { questions, loading, status: 'live', refetch: fetchQuestions };
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

export async function toggleQuestionVote(questionId: string) {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_URL}/api/qa/questions/${questionId}/vote`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err: any) {
    toast.error(err.message);
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
    
    socket.on('qa_answer_updated', () => {
      // Just re-fetch to get new vote counts
      fetchAnswers();
    });
    
    return () => {
      socket.emit('leave_qa_question', questionId);
      socket.disconnect();
    };
  }, [questionId, fetchAnswers]);

  return { answers, loading, status: 'live', refetch: fetchAnswers };
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

export async function toggleAnswerVote(answerId: string) {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_URL}/api/qa/answers/${answerId}/vote`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err: any) {
    toast.error(err.message);
  }
}
