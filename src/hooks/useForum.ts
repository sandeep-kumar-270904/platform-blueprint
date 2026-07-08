import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ForumThread {
  _id?: string;
  id?: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  reply_count: number;
  view_count: number;
  like_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_activity_at: string;
  created_at?: string;
  createdAt?: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export interface ForumReply {
  _id?: string;
  id?: string;
  thread_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  like_count: number;
  created_at?: string;
  createdAt?: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export function useForumThreads(category?: string, sort: "recent" | "trending" | "unanswered" = "recent") {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (category) qs.append('category', category);
      if (sort) qs.append('sort', sort);
      
      const res = await fetch(`${API_URL}/api/forum/threads?${qs.toString()}`);
      let data = await res.json();
      data = data.map((t: any) => ({ ...t, id: t._id, created_at: t.createdAt }));
      setThreads(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load forum threads");
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  useEffect(() => {
    setLoading(true);
    fetchThreads();
    
    const socket = io(API_URL);
    socket.on('forum_thread_created', () => fetchThreads());
    socket.on('forum_thread_updated', () => fetchThreads());
    
    return () => {
      socket.disconnect();
    };
  }, [fetchThreads]);

  return { threads, loading, status: 'connected', refetch: fetchThreads };
}

export async function createThread(input: { title: string; body: string; category: string; tags: string[] }) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/api/forum/threads`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to create thread');
    toast.success("Thread posted");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function toggleThreadLike(threadId: string) {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_URL}/api/forum/threads/${threadId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err: any) {
    toast.error(err.message);
  }
}

export async function incrementThreadViews(threadId: string) {
  try {
    await fetch(`${API_URL}/api/forum/threads/${threadId}/view`, { method: 'POST' });
  } catch (err) {}
}

export function useForumReplies(threadId: string | null) {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReplies = useCallback(async () => {
    if (!threadId) { setReplies([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/forum/threads/${threadId}/replies`);
      let data = await res.json();
      data = data.map((r: any) => ({ ...r, id: r._id, created_at: r.createdAt }));
      setReplies(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load replies");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    setLoading(true);
    fetchReplies();
    
    if (!threadId) return;

    const socket = io(API_URL);
    socket.emit('join_forum_thread', threadId);
    
    socket.on('forum_reply_created', (newReply) => {
      newReply.id = newReply._id;
      newReply.created_at = newReply.createdAt;
      setReplies(prev => [...prev, newReply]);
    });
    
    return () => {
      socket.emit('leave_forum_thread', threadId);
      socket.disconnect();
    };
  }, [threadId, fetchReplies]);

  return { replies, loading, status: 'connected', refetch: fetchReplies };
}

export async function postReply(threadId: string, body: string, parentId?: string | null) {
  if (!body.trim()) { toast.error("Reply cannot be empty"); return null; }
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/api/forum/threads/${threadId}/replies`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim(), parent_id: parentId })
    });
    if (!res.ok) throw new Error('Failed to post reply');
    toast.success("Reply posted");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}
