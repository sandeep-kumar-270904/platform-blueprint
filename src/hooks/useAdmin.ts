import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AdminNote {
  id: string;
  title: string;
  subject: string;
  category: string | null;
  rating: number;
  views: number;
  downloads: number;
  report_count: number;
  created_at: string;
  user_id: string;
  profile?: { username: string | null; full_name: string | null };
  quality_score?: number;
}

export interface AdminComment {
  id: string;
  content: string;
  note_id: string;
  user_id: string;
  upvotes: number;
  downvotes: number;
  is_reported: boolean;
  is_helpful: boolean;
  created_at: string;
  profile?: { username: string | null; full_name: string | null };
  note_title?: string;
}

export interface AdminReport {
  id: string;
  content_type: string;
  content_id: string;
  reported_by: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  reporter_profile?: { username: string | null; full_name: string | null };
}

export interface AdminUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  notes_count: number;
  avg_rating: number;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ totalNotes: 0, totalUsers: 0, pendingReports: 0, flaggedNotes: 0 });

  const checkAdmin = useCallback(async () => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  const loadDashboard = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
        setComments(data.comments);
        setReports(data.reports);
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    }
  }, [isAdmin]);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const deleteNote = async (noteId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success("Note deleted");
      loadDashboard();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success("Comment deleted");
      loadDashboard();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const updateReportStatus = async (reportId: string, status: string, adminNote?: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, admin_note: adminNote })
      });
      if (!res.ok) throw new Error();
      toast.success(`Report ${status}`);
      loadDashboard();
    } catch {
      toast.error("Failed to update report");
    }
  };

  const deleteReportedContent = async (report: AdminReport) => {
    if (report.content_type === "note") {
      await deleteNote(report.content_id);
    } else {
      await deleteComment(report.content_id);
    }
    await updateReportStatus(report.id, "reviewed", "Content deleted by admin");
  };

  return {
    isAdmin, loading, notes, comments, reports, users, stats,
    deleteNote, deleteComment, updateReportStatus, deleteReportedContent,
    refresh: loadDashboard,
  };
};
