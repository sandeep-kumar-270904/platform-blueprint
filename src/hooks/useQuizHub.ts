import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  category: string;
  createdBy: string;
  mode: 'solo' | 'live';
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  status: 'draft' | 'published' | 'under_review' | 'closed';
  attemptCount: number;
  averageScore: number;
  question_count: number;
  createdAt: string;
}

export interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
  explanation?: string;
}

export interface QuizAttempt {
  _id: string;
  quiz: Quiz | string;
  user: string;
  answers: {
    questionIndex: number;
    selectedOptionIndex: number;
    isCorrect: boolean;
    timeTakenSeconds: number;
  }[];
  score: number;
  totalPossibleScore: number;
  percentageScore: number;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const useQuizzes = (params?: { search?: string; category?: string; difficulty?: string; mode?: string }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [total, setTotal] = useState(0);
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.append('search', params.search);
      if (params?.category) qs.append('category', params.category);
      if (params?.difficulty) qs.append('difficulty', params.difficulty);
      if (params?.mode) qs.append('mode', params.mode);

      const res = await fetch(`${API_URL}/api/quizzes?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
        setTotal(data.total || 0);
        setTotalUnfiltered(data.totalUnfiltered || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.category, params?.difficulty, params?.mode]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  return { quizzes, total, totalUnfiltered, loading, refetch: fetchAll };
};

export const useQuizCategories = () => {
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/quizzes/categories-summary`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return { categories, loading };
};

export const useTrendingQuizzes = () => {
  const [trending, setTrending] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_URL}/api/quizzes/trending`);
        if (res.ok) {
          const data = await res.json();
          setTrending(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return { trending, loading };
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  try {
    const res = await fetch(`${API_URL}/api/quizzes/${quizId}`);
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
};

export const getLeaderboard = async (quizId: string) => {
  try {
    const res = await fetch(`${API_URL}/api/quizzes/${quizId}/leaderboard`);
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
};

export const createQuiz = async (input: Partial<Quiz> & { questions: Partial<QuizQuestion>[] }) => {
  const res = await fetch(`${API_URL}/api/quizzes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create quiz');
  }
  return await res.json();
};

export const importQuestions = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/quizzes/import-questions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
      // Note: Do not set Content-Type to application/json, browser will set it with boundary for FormData
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to import questions');
  }
  return await res.json();
};

export const draftQuestionsWithAI = async (topic: string, difficulty: string, count: number) => {
  const res = await fetch(`${API_URL}/api/quizzes/ai-draft-questions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic, difficulty, count })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to draft questions');
  }
  return await res.json();
};

export const checkQuestionWithAI = async (questionText: string, options: string[], correctOptionIndex: number) => {
  const res = await fetch(`${API_URL}/api/quizzes/ai-check`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ questionText, options, correctOptionIndex })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to check question');
  }
  return await res.json();
};

export const startAttempt = async (quizId: string): Promise<{ attempt: QuizAttempt; quiz: Quiz & { questions: QuizQuestion[] } }> => {
  const res = await fetch(`${API_URL}/api/quizzes/${quizId}/start`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to start quiz');
  }
  return await res.json();
};

export const startAdaptivePractice = async (bankId: string): Promise<{ attempt: QuizAttempt; quiz: Quiz & { questions: QuizQuestion[] } }> => {
  const res = await fetch(`${API_URL}/api/quizzes/adaptive/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ bankId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to start adaptive practice');
  }
  return await res.json();
};

export const submitAttempt = async (attemptId: string, answers: { questionIndex: number; selectedOptionIndex: number; timeTakenSeconds?: number }[]): Promise<{ attempt: QuizAttempt; gamificationResult?: any }> => {
  const headers = getAuthHeaders();
  headers['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ answers })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to submit quiz');
  }
  return await res.json();
};

export const getAttemptResults = async (attemptId: string): Promise<QuizAttempt | null> => {
  try {
    const res = await fetch(`${API_URL}/api/attempts/${attemptId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
};

export const getMyQuizzes = async (): Promise<QuizAttempt[]> => {
  try {
    const res = await fetch(`${API_URL}/api/attempts/me`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
};

export const createLiveSession = async (quizId: string, options?: { pacingMode?: 'host'|'self', opensAt?: string, closesAt?: string }) => {
  const res = await fetch(`${API_URL}/api/live-sessions/quiz/${quizId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(options || {})
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create live session');
  }
  return await res.json();
};

export const joinLiveSession = async (joinCode: string) => {
  const res = await fetch(`${API_URL}/api/live-sessions/join/${joinCode}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to join session');
  }
  return await res.json();
};

export const reportQuiz = async (quizId: string, reason: string, details?: string) => {
  const res = await fetch(`${API_URL}/api/quizzes/${quizId}/report`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason, details })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to report quiz');
  }
  return await res.json();
};

export const subscribeToQuiz = async (quizId: string) => {
  const res = await fetch(`${API_URL}/api/quizzes/${quizId}/subscribe`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to subscribe to quiz');
  }
  return await res.json();
};

export const unsubscribeFromQuiz = async (quizId: string) => {
  const res = await fetch(`${API_URL}/api/quizzes/${quizId}/subscribe`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to unsubscribe from quiz');
  }
  return await res.json();
};

export const inviteToLiveSession = async (sessionId: string, emails: string[]) => {
  const res = await fetch(`${API_URL}/api/live-sessions/${sessionId}/invite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ emails })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to send invites');
  }
  return await res.json();
};
export const getQuizDashboard = async () => {
  const res = await fetch(`${API_URL}/api/me/quiz-dashboard`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch dashboard');
  }
  return await res.json();
};
