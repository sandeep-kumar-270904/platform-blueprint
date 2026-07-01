import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ClassroomRow {
  id: string;
  host_id: string;
  title: string;
  subject: string | null;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  participant_count: number;
  status: string;
  meeting_link: string | null;
  recording_url: string | null;
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
    const from = (currentPage - 1) * limit;
    const to = from + limit - 1;
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

    // Retry wrapper for resilient fetching
    const fetchWithRetry = async (fn: () => Promise<any>, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try { return await fn(); } 
        catch (e) { if (i === retries - 1) throw e; await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
      }
    };

    try {
      const { data } = await fetchWithRetry(() => 
        supabase.from("virtual_classrooms").select("*").order("scheduled_at", { ascending: true }).range(from, to)
      );
      
      let filteredData = (data as ClassroomRow[]) || [];
      setHasMore(filteredData.length === limit);
      
      let joinedMap: Record<string, ParticipantRow> = isLoadMore ? { ...joined } : {};
      
      if (user) {
        // Fetch blocks to filter out blocked hosts
        const { data: blocks } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id);
        if (blocks && blocks.length > 0) {
          const blockedIds = new Set(blocks.map(b => b.blocked_id));
          filteredData = filteredData.filter(c => !blockedIds.has(c.host_id));
        }
  
        const { data: p } = await supabase.from("virtual_classroom_participants").select("*").eq("user_id", user.id);
        if (p) {
          p.forEach((x: any) => {
            joinedMap[x.classroom_id] = x;
          });
        }
      }
      
      setClassrooms(prev => isLoadMore ? [...prev, ...filteredData] : filteredData);
      setJoined(joinedMap);
      if (isLoadMore) setPage(currentPage);
      
      // Update cache (only cache page 1 for offline fallback)
      if (!isLoadMore) {
        localStorage.setItem("virtual_classrooms_cache", JSON.stringify({
          classrooms: filteredData,
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

  const status = useRealtimeSync({
    channelName: "virtual-classrooms",
    filters: [{ table: "virtual_classrooms" }, { table: "virtual_classroom_participants" }],
    onChange: fetchAll,
  });

  const join = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.rpc("join_virtual_classroom", { _classroom_id: id });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Joined classroom" });
  };
  const leave = async (id: string) => {
    const { error } = await supabase.rpc("leave_virtual_classroom", { _classroom_id: id });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Left classroom" });
  };

  const create = async (payload: Partial<ClassroomRow>) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.from("virtual_classrooms").insert({
      host_id: user.id,
      title: payload.title!,
      subject: payload.subject || null,
      description: payload.description || "",
      scheduled_at: payload.scheduled_at!,
      duration_minutes: payload.duration_minutes || 60,
      max_participants: payload.max_participants || 50,
      visibility: payload.visibility || "public",
      type: payload.type || "interactive",
      is_paid: payload.is_paid || false,
      price: payload.price || 0
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Classroom scheduled" });
  };

  return { classrooms, joined, loading, status, join, leave, create, refetch: fetchAll, loadMore, hasMore };
};
