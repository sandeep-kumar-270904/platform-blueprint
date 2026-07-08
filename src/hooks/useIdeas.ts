import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface IdeaRow {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  status: string | null;
  upvotes: number | null;
  tags: string[] | null;
  created_at: string;
  user_id: string;
  team_id: string | null;
  is_public: boolean | null;
}

export interface IdeaWithProfile extends IdeaRow {
  profile?: { username: string | null; avatar_url: string | null };
}

export const useIdeas = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<IdeaWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ideas`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((i: any) => ({ ...i, id: i._id }));
        setIdeas(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();

    const socket = io(API_URL);
    socket.on('ideas-realtime', (payload) => {
      if (payload.action === 'update') {
        const newIdea = { ...payload.data, id: payload.data._id };
        setIdeas(prev => prev.map(i => i.id === newIdea.id ? { ...i, ...newIdea, profile: i.profile } : i));
      } else {
        fetchIdeas();
      }
    });

    return () => { socket.disconnect(); };
  }, [fetchIdeas]);

  const upvoteIdea = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    // Optimistic update
    const newVotes = (idea.upvotes || 0) + 1;
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, upvotes: newVotes } : i));
    
    try {
      await fetch(`${API_URL}/api/ideas/${ideaId}/upvote`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  return { ideas, loading, refetch: fetchIdeas, upvoteIdea };
};
