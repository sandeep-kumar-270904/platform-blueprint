import { useCallback, useState } from "react";
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;

  const fetchAll = useCallback(async (isLoadMore = false) => {
    const currentPage = isLoadMore ? page + 1 : 1;
    
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
      const res = await fetch(`${API_URL}/api/classrooms?page=${currentPage}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch classrooms');
      let data = await res.json();
      
      // Map _id to id for frontend compatibility
      data = data.map((c: any) => ({ ...c, id: c._id }));

      setHasMore(data.length === limit);
      
      let joinedMap: Record<string, ParticipantRow> = isLoadMore ? { ...joined } : {};
      
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
      toast({ title: "Network Error", description: "Could not fetch classrooms. Retrying later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, page, joined]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchAll(true);
    }
  };

  const join = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join');
      toast({ title: data.message });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const leave = async (id: string) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to leave');
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

  return { classrooms, joined, loading, status: 'connected', join, leave, create, remove, refetch: fetchAll, loadMore, hasMore };
};
