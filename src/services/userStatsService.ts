import { create } from 'zustand';

export interface UserStats {
  points: number;
  level: number;
  streak: number;
  completedQuizzes: number;
  rank: string;
}

interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (forceRefresh?: boolean) => Promise<void>;
  updateLocalStats: (updates: Partial<UserStats>) => void;
}

// Ensure base API URL is properly set for Vite environments
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useUserStats = create<UserStatsState>((set, get) => ({
  stats: null,
  loading: false,
  error: null,
  
  fetchStats: async (forceRefresh = false) => {
    // If we already have stats and aren't forcing a refresh, skip the fetch
    if (get().stats && !forceRefresh) return;
    
    set({ loading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
         set({ loading: false, error: 'Unauthenticated' });
         return;
      }

      const res = await fetch(`${API_URL}/api/users/me/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      const data = await res.json();
      set({ stats: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  // This allows components to instantly reflect changes without waiting for a re-fetch
  // For example, if a user finishes a quiz and earns 100 points, we can add 100 points locally immediately.
  updateLocalStats: (updates) => {
    const currentStats = get().stats;
    if (currentStats) {
      set({ stats: { ...currentStats, ...updates } });
    }
  }
}));
