import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface CommunityPost {
  _id?: string;
  id?: string;
  user_id: string;
  content: string;
  image_url: string | null;
  tags: string[];
  like_count: number;
  comment_count: number;
  created_at?: string;
  createdAt?: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export interface CommunityComment {
  _id?: string;
  id?: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at?: string;
  createdAt?: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('live');

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/posts`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((p: any) => ({ ...p, id: p._id, created_at: p.createdAt }));
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts();

    const socket = io(API_URL);
    socket.on('community_post_created', () => fetchPosts());
    socket.on('community_post_updated', () => fetchPosts());

    return () => {
      socket.disconnect();
    };
  }, [fetchPosts]);

  return { posts, loading, status, refetch: fetchPosts };
}

export async function createPost(input: { content: string; tags?: string[]; image_url?: string | null }) {
  const token = localStorage.getItem('token');
  if (!token) { toast.error("Please sign in"); return null; }
  if (!input.content.trim()) { toast.error("Post cannot be empty"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/community/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to post');
    toast.success("Posted");
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function togglePostLike(postId: string) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch(`${API_URL}/api/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err: any) {
    toast.error(err.message);
  }
}

export function usePostComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('live');

  const fetchComments = useCallback(async () => {
    if (!postId) { setComments([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/comments`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((c: any) => ({ ...c, id: c._id, created_at: c.createdAt }));
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    fetchComments();

    const socket = io(API_URL);
    socket.emit('join_community_post', postId);
    
    socket.on('community_comment_created', (newComment) => {
      // Best effort real-time update; re-fetching ensures we get author profile populated
      fetchComments();
    });

    return () => {
      socket.emit('leave_community_post', postId);
      socket.disconnect();
    };
  }, [postId, fetchComments]);

  return { comments, loading, status, refetch: fetchComments };
}

export async function postComment(postId: string, content: string) {
  const token = localStorage.getItem('token');
  if (!token) { toast.error("Please sign in"); return null; }
  if (!content.trim()) { toast.error("Comment cannot be empty"); return null; }
  
  try {
    const res = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() })
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return await res.json();
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}
