import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface AttendanceRow {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  method: string;
}

export const useEventAttendance = (eventId: string | null) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data } = await supabase.from("event_attendance").select("*").eq("event_id", eventId);
    setRows((data || []) as AttendanceRow[]);
    const ids = Array.from(new Set((data || []).map((r: any) => r.user_id)));
    if (ids.length) {
      const { data: pr } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      const map: Record<string, any> = {};
      (pr || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const checkIn = async (userId?: string) => {
    if (!user || !eventId) return;
    const { error } = await supabase.rpc("check_in_event", { _event_id: eventId, _user_id: userId || null });
    if (error) toast({ title: "Check-in failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Checked in" }); fetchAll(); }
  };

  const exportCsv = (eventTitle: string) => {
    const header = ["Name", "Username", "User ID", "Checked In", "Method"];
    const lines = rows.map((r) => {
      const p = profiles[r.user_id] || {};
      return [
        `"${(p.full_name || "").replace(/"/g, '""')}"`,
        p.username || "",
        r.user_id,
        new Date(r.checked_in_at).toISOString(),
        r.method,
      ].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${eventTitle.replace(/[^a-z0-9]/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { rows, profiles, loading, checkIn, exportCsv, refetch: fetchAll };
};

export const useMyAttendance = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    supabase.from("event_attendance").select("*", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setCount(count || 0));
  }, [user]);
  return count;
};
