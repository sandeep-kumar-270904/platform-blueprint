import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Quiz {
  id: string;
  _id?: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration_minutes: number;
  attempts_count: number;
  question_count: number;
  is_public: boolean;
  created_at: string;
  createdAt?: string;
}

export interface QuizQuestion {
  id: string;
  _id?: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  position: number;
}

export type SyncStatus = "live" | "connecting" | "error";

export const useQuizzes = (): { quizzes: Quiz[]; loading: boolean; status: SyncStatus; refetch: () => Promise<void> } => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>("live");

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((q: any) => ({ ...q, id: q._id, created_at: q.createdAt }));
        setQuizzes(data as Quiz[]);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll();

    const socket = io(API_URL);
    socket.on('quizzes-public', () => fetchAll());

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  return { quizzes, loading, status, refetch: fetchAll };
};

export const fetchQuizQuestions = async (quizId: string): Promise<QuizQuestion[]> => {
  try {
    const res = await fetch(`${API_URL}/api/quizzes/${quizId}/questions`);
    if (res.ok) {
      let data = await res.json();
      return data.map((q: any) => ({ ...q, id: q._id }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const createQuiz = async (input: {
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  questions: { question: string; options: string[]; correct_index: number; explanation?: string }[];
}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_URL}/api/quizzes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create quiz');
  }
  
  const data = await res.json();
  return { ...data, id: data._id };
};

export const recordAttempt = async (quizId: string, score: number, total: number, timeSeconds: number, answers: number[]) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_URL}/api/quizzes/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, total, time_seconds: timeSeconds, answers })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to record attempt');
  }
  
  return await res.json();
};
