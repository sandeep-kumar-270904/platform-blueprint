import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Roadmap {
  id: string;
  _id?: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration: string | null;
  topics: string[];
  step_count: number;
  is_public: boolean;
  created_at: string;
  createdAt?: string;
}

export interface RoadmapStep {
  id: string;
  _id?: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  resources: { label: string; url: string }[];
  position: number;
}

export interface CheatSheet {
  id: string;
  _id?: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  format: string;
  pages: number;
  downloads: number;
  created_at: string;
}

export type SyncStatus = "live" | "connecting" | "error";

export const useRoadmaps = (): {
  roadmaps: Roadmap[];
  loading: boolean;
  status: SyncStatus;
  completedSteps: Set<string>;
  refetch: () => Promise<void>;
} => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>("live");

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/roadmaps`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((rm: any) => ({ ...rm, id: rm._id, created_at: rm.createdAt }));
        setRoadmaps(data as Roadmap[]);
      }
      
      if (user) {
        const token = localStorage.getItem('token');
        if (token) {
          const progressRes = await fetch(`${API_URL}/api/roadmaps/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (progressRes.ok) {
            const progress = await progressRes.json();
            setCompletedSteps(new Set(progress.map((p: any) => p.step_id)));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchAll();

    const socket = io(API_URL);
    socket.on('roadmaps', () => fetchAll());

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  return { roadmaps, loading, status, completedSteps, refetch: fetchAll };
};

export const fetchSteps = async (roadmapId: string): Promise<RoadmapStep[]> => {
  try {
    const res = await fetch(`${API_URL}/api/roadmaps/${roadmapId}/steps`);
    if (res.ok) {
      const data = await res.json();
      return data.map((s: any) => ({ ...s, id: s._id }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const createRoadmap = async (input: {
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  duration?: string;
  topics: string[];
  steps: { title: string; description?: string }[];
}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/roadmaps`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create roadmap');
  }
  
  const data = await res.json();
  return { ...data, id: data._id };
};

export const toggleStep = async (roadmapId: string, stepId: string) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/roadmaps/${roadmapId}/steps/${stepId}/toggle`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to toggle step');
  }
  
  return await res.json();
};

export const useCheatSheets = (): { sheets: CheatSheet[]; loading: boolean; status: SyncStatus; refetch: () => Promise<void> } => {
  const [sheets, setSheets] = useState<CheatSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>("live");

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/roadmaps/cheatsheets`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((s: any) => ({ ...s, id: s._id, created_at: s.createdAt }));
        setSheets(data as CheatSheet[]);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  return { sheets, loading, status, refetch: fetchAll };
};

export const downloadCheatSheet = async (id: string, fileUrl: string | null) => {
  try {
    await fetch(`${API_URL}/api/roadmaps/cheatsheets/${id}/download`, { method: 'POST' });
    if (fileUrl) window.open(fileUrl, "_blank", "noopener");
  } catch (err) {
    console.error('Failed to register download', err);
  }
};
