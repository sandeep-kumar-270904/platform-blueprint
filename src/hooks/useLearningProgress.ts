import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface LearningSummary {
  quizAttempts: number;
  avgQuizScore: number;
  bestQuizScore: number;
  totalQuizMinutes: number;
  roadmapStepsDone: number;
  studyGroups: number;
  groupMessagesSent: number;
  classroomsJoined: number;
  eventsAttended: number;
  sessionsRsvp: number;
  recentQuizzes: Array<{ id: string; score: number; total: number; created_at: string; quiz_id: string }>;
}

const empty: LearningSummary = {
  quizAttempts: 0, avgQuizScore: 0, bestQuizScore: 0, totalQuizMinutes: 0,
  roadmapStepsDone: 0, studyGroups: 0, groupMessagesSent: 0,
  classroomsJoined: 0, eventsAttended: 0, sessionsRsvp: 0, recentQuizzes: [],
};

export const useLearningProgress = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LearningSummary>(empty);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setSummary(empty);
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/learning-progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        setSummary(empty);
      }
    } catch (err) {
      console.error(err);
      setSummary(empty);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    
    // Poll every 60 seconds as fallback
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { summary, loading, refetch: fetchAll };
};
