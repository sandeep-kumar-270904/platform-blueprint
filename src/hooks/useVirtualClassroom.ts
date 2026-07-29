import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ClassroomRow {
  _id: string;
  id: string; // Map _id to id for backwards compatibility in UI
  host_id: string;
  title: string;
  subject: string | null;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  participant_count: number;
  status: string;
  join_code: string;
  visibility: string;
  type: string;
  is_paid: boolean;
  price: number;
  parent_series_id?: string;
  series_index?: number;
  series_total?: number;
  tags?: string[];
  prerequisites?: string;
  co_hosts?: string[];
}

export interface ParticipantRow {
  classroom_id: string;
  user_id: string;
  role: string;
  status: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useVirtualClassroom = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [joined, setJoined] = useState<Record<string, ParticipantRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const limit = 12;

  const fetchAll = useCallback(async (isLoadMore = false, query = '', subject = 'All') => {
    const currentPage = isLoadMore ? page + 1 : 1;
    if (!isLoadMore) setLoading(true);
    setError(null);
    
    // If offline, attempt to load from cache
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const cached = localStorage.getItem("virtual_classrooms_cache");
        if (cached) {
          const { classrooms: cachedClasses, joined: cachedJoined } = JSON.parse(cached);
          setClassrooms(cachedClasses);
          setJoined(cachedJoined);
        }
      } catch (e) {
        console.error("Failed to load cached classrooms", e);
      }
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Classrooms
      const res = await fetch(`${API_URL}/api/classrooms?page=${currentPage}&limit=${limit}${query ? `&q=${encodeURIComponent(query)}` : ''}&subject=${encodeURIComponent(subject)}`);
      if (!res.ok) throw new Error('Failed to fetch classrooms');
      let data = await res.json();
      
      // Map _id to id for frontend compatibility
      data = data.map((c: any) => ({ ...c, id: c._id }));

      setHasMore(data.length === limit);
      
      const joinedMap: Record<string, ParticipantRow> = isLoadMore ? { ...joined } : {};
      
      if (user) {
        const token = localStorage.getItem('token');
        if (token) {
          const pRes = await fetch(`${API_URL}/api/classrooms/my-participation`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (pRes.ok) {
            const participations = await pRes.json();
            participations.forEach((x: any) => {
              joinedMap[x.classroom_id] = x;
            });
          }
        }
      }
      
      setClassrooms(prev => isLoadMore ? [...prev, ...data] : data);
      setJoined(joinedMap);
      if (isLoadMore) setPage(currentPage);
      
      // Update cache
      if (!isLoadMore) {
        localStorage.setItem("virtual_classrooms_cache", JSON.stringify({
          classrooms: data,
          joined: joinedMap
        }));
      }
    } catch (err) {
      console.error("Error fetching classrooms", err);
      setError("Failed to load classrooms. Please try again later.");
      toast({ title: "Network Error", description: "Could not fetch classrooms. Retrying later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, page, joined]);

  const loadMore = (query = '', subject = 'All') => {
    if (!loading && hasMore) {
      fetchAll(true, query, subject);
    }
  };

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); fetchAll(); };
    const handleOffline = () => setIsOffline(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    fetchAll();
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [fetchAll]);

  const join = async (id: string, joinSeries = false) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    
    setJoined(prev => ({
      ...prev,
      [id]: { classroom_id: id, user_id: user.id, role: 'participant', status: 'registered' }
    }));
    setClassrooms(prev => prev.map(c => c.id === id ? { ...c, participant_count: c.participant_count + 1 } : c));

    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/join${joinSeries ? '?join_series=true' : ''}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        fetchAll();
        throw new Error(data.message || 'Failed to join');
      }
      toast({ title: data.message });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const leave = async (id: string) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    
    setJoined(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setClassrooms(prev => prev.map(c => c.id === id ? { ...c, participant_count: Math.max(0, c.participant_count - 1) } : c));

    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        fetchAll();
        throw new Error('Failed to leave');
      }
      toast({ title: "Left classroom" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const create = async (payload: Partial<ClassroomRow>) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create');
      toast({ title: "Classroom scheduled" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: "Classroom cancelled" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const editClassroom = async (id: string, updates: Partial<ClassroomRow>) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update classroom');
      toast({ title: "Classroom updated" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const cancelClassroom = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to cancel classroom');
      toast({ title: "Classroom cancelled" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleReminder = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/reminders`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle reminders');
      const data = await res.json();
      toast({ title: data.reminders_opt_in ? "Reminders enabled" : "Reminders disabled" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const addRecording = async (id: string, url: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/recording`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_url: url })
      });
      if (!res.ok) throw new Error('Failed to add recording');
      toast({ title: "Recording added" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const submitRating = async (id: string, rating: number, feedback: string, technical_issue: boolean = false, technical_issue_details: string = '') => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/rating`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, technical_issue, technical_issue_details })
      });
      if (!res.ok) throw new Error('Failed to submit rating');
      toast({ title: "Rating submitted" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const downloadCertificate = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/certificate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate certificate');
      const data = await res.json();
      // For MVP, we just show a toast, but in reality we could generate a PDF here
      toast({ title: "Certificate Ready", description: `Certificate for ${data.course_title} downloaded!` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const createPoll = async (id: string, question: string, options: string[]) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/polls`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options })
      });
      if (!res.ok) throw new Error('Failed to create poll');
      toast({ title: "Poll created" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const votePoll = async (id: string, pollId: string, optionId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      if (!res.ok) throw new Error('Failed to vote');
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const fetchHistory = async () => {
    if (!user) return [];
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      return data.map((c: any) => ({ ...c, id: c._id }));
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
      return [];
    }
  };

  const addMaterial = async (id: string, title: string, url: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/materials`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url })
      });
      if (!res.ok) throw new Error('Failed to add material');
      toast({ title: "Material added" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const addAnnouncement = async (id: string, message: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/announcements`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error('Failed to add announcement');
      toast({ title: "Announcement added" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  return { 
    classrooms, joined, loading, error, status: 'live', isOffline,
    join, leave, create, remove, refetch: fetchAll, loadMore, hasMore,
    editClassroom, cancelClassroom, toggleReminder, addRecording, submitRating,
    downloadCertificate, createPoll, votePoll, fetchHistory, addMaterial, addAnnouncement
  };
};
