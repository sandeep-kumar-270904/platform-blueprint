import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type SortMode = "top" | "new" | "discussed";

export interface Comment {
  id: string;
  _id?: string;
  content: string;
  user_id: string;
  upvotes: number;
  downvotes: number;
  is_helpful: boolean;
  is_reported: boolean;
  is_edited: boolean;
  created_at: string;
  parent_id: string | null;
  note_id: string;
  profile?: { username: string | null; full_name: string | null };
  userVote?: "up" | "down" | null;
  replyCount?: number;
}

const PAGE_SIZE = 15;

export const useNoteComments = (noteId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("top");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadComments = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);

    setLoading(true);

    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/note-comments/notes/${noteId}/comments?page=${currentPage}&limit=${PAGE_SIZE}&sort=${sortMode}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data.map((c: any) => ({ ...c, id: c._id }));
        setTotalCount(json.count);
        setHasMore(data.length === PAGE_SIZE);

        if (reset || currentPage === 0) {
          setComments(data);
        } else {
          setComments(prev => [...prev, ...data]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [noteId, sortMode, page, user]);

  useEffect(() => {
    loadComments(true);

    const socket = io(API_URL);
    socket.on(`comments-${noteId}`, () => loadComments(true));

    return () => {
      socket.disconnect();
    };
  }, [noteId, sortMode, loadComments]);

  const addComment = async (content: string, parentId: string | null = null) => {
    if (!user) { toast.error("Please sign in to comment"); return; }
    if (!content.trim()) return;

    if (parentId) {
      const parent = comments.find(c => c.id === parentId);
      if (parent?.parent_id) {
        const grandparent = comments.find(c => c.id === parent.parent_id);
        parentId = grandparent?.parent_id ? grandparent.parent_id : parent.parent_id;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/note-comments/notes/${noteId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), parent_id: parentId })
      });
      if (!res.ok) throw new Error();
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/note-comments/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim() })
      });
      if (!res.ok) throw new Error();
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to edit");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/note-comments/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const vote = async (commentId: string, voteType: "up" | "down") => {
    if (!user) { toast.error("Please sign in to vote"); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/note-comments/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ vote_type: voteType })
      });
      if (!res.ok) throw new Error();
      loadComments(true);
    } catch {
      toast.error("Failed to vote");
    }
  };

  const markHelpful = async (commentId: string, isHelpful: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/note-comments/comments/${commentId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_helpful: !isHelpful })
      });
      if (!res.ok) throw new Error();
      toast.success(isHelpful ? "Unmarked as helpful" : "Marked as helpful!");
      loadComments(true);
    } catch {
      toast.error("Failed to update");
    }
  };

  const reportComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/note-comments/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: "Inappropriate content" })
      });
      if (!res.ok) throw new Error();
      toast.success("Comment reported. Thank you!");
    } catch {
      toast.error("Failed to report");
    }
  };

  const loadMore = () => {
    setPage(p => p + 1);
    loadComments(false);
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return {
    comments,
    topLevel,
    getReplies,
    loading,
    submitting,
    sortMode,
    setSortMode,
    totalCount,
    hasMore,
    loadMore,
    addComment,
    editComment,
    deleteComment,
    vote,
    markHelpful,
    reportComment,
    user,
  };
};
