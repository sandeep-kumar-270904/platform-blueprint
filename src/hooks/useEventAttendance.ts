import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AttendanceRow {
  _id?: string;
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  method: string;
}

export const useEventAttendance = (eventId: string | null) => {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/attendance`);
      if (res.ok) {
        const { rows, profiles } = await res.json();
        setRows(rows.map((r: any) => ({ ...r, id: r._id })));
        
        const profileMap: Record<string, any> = {};
        profiles.forEach((p: any) => { profileMap[p._id] = p; });
        setProfiles(profileMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { 
    fetchAll(); 
    
    if (!eventId) return;
    const socket = io(API_URL);
    socket.on('event_attendance_updated', (updatedEventId) => {
      if (updatedEventId === eventId) fetchAll();
    });
    
    return () => {
      socket.disconnect();
    };
  }, [fetchAll, eventId]);

  const checkIn = async (userId?: string) => {
    const token = localStorage.getItem('token');
    if (!token || !eventId) return;
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Check-in failed');
      }
      toast({ title: "Checked in" });
    } catch (error: any) {
      toast({ title: "Check-in failed", description: error.message, variant: "destructive" });
    }
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
  const [count, setCount] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/events/attendance/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setCount(data.count || 0))
    .catch(() => {});
  }, []);
  return count;
};
