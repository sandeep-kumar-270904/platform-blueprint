import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRealtimeSync } from "./useRealtimeSync";

export interface LearningSummary {
  quizAttempts: number;
  avgQuizScore: number;
  bestQuizScore: number;
  totalQuizMinutes: number;
  roadmapStepsDone: number;
  flashcardDecks: number;
  studyGroups: number;
  groupMessagesSent: number;
  classroomsJoined: number;
  eventsAttended: number;
  sessionsRsvp: number;
  recentQuizzes: Array<{ id: string; score: number; total: number; created_at: string; quiz_id: string }>;
}

const empty: LearningSummary = {
  quizAttempts: 0, avgQuizScore: 0, bestQuizScore: 0, totalQuizMinutes: 0,
  roadmapStepsDone: 0, flashcardDecks: 0, studyGroups: 0, groupMessagesSent: 0,
  classroomsJoined: 0, eventsAttended: 0, sessionsRsvp: 0, recentQuizzes: [],
};

export const useLearningProgress = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LearningSummary>(empty);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [quizRes, roadmapRes, decksRes, groupsRes, msgsRes, classroomRes, attendanceRes, sessionsRes] = await Promise.all([
      supabase.from("quiz_attempts").select("id, quiz_id, score, total, time_taken_seconds, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("roadmap_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("flashcard_decks").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("study_group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("study_group_messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("virtual_classroom_participants").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("event_attendance").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("learning_session_participants").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const qa = quizRes.data || [];
    const pcts = qa.map((q: any) => (q.total ? (q.score / q.total) * 100 : 0));
    const avg = pcts.length ? pcts.reduce((s, n) => s + n, 0) / pcts.length : 0;
    const best = pcts.length ? Math.max(...pcts) : 0;
    const seconds = qa.reduce((s: number, q: any) => s + (q.time_taken_seconds || 0), 0);

    setSummary({
      quizAttempts: qa.length,
      avgQuizScore: Math.round(avg),
      bestQuizScore: Math.round(best),
      totalQuizMinutes: Math.round(seconds / 60),
      roadmapStepsDone: roadmapRes.count || 0,
      flashcardDecks: decksRes.count || 0,
      studyGroups: groupsRes.count || 0,
      groupMessagesSent: msgsRes.count || 0,
      classroomsJoined: classroomRes.count || 0,
      eventsAttended: attendanceRes.count || 0,
      sessionsRsvp: sessionsRes.count || 0,
      recentQuizzes: qa.slice(0, 5).map((q: any) => ({
        id: q.id, quiz_id: q.quiz_id, score: q.score, total: q.total, created_at: q.created_at,
      })),
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useRealtimeSync({
    channelName: user ? `learning-progress-${user.id}` : undefined,
    enabled: !!user,
    filters: user ? [
      { table: "quiz_attempts", filter: `user_id=eq.${user.id}` },
      { table: "roadmap_progress", filter: `user_id=eq.${user.id}` },
      { table: "study_group_members", filter: `user_id=eq.${user.id}` },
      { table: "study_group_messages", filter: `user_id=eq.${user.id}` },
      { table: "virtual_classroom_participants", filter: `user_id=eq.${user.id}` },
      { table: "event_attendance", filter: `user_id=eq.${user.id}` },
      { table: "learning_session_participants", filter: `user_id=eq.${user.id}` },
    ] : [],
    onChange: fetchAll,
    pollIntervalMs: 60000,
  });

  return { summary, loading, refetch: fetchAll };
};
