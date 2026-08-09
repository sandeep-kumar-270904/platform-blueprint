import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface StudentProfile {
  branchOfInterest: string;
  budgetRange: string;
  locationPreference: string;
  priorities: string[];
  currentAcademicStanding: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp?: string;
}

export const useMentor = () => {
  const [loading, setLoading] = useState(false);

  const getHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    try {
      const res = await fetch(`${API_URL}/api/mentor/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch mentor history');
      return await res.json();
    } catch (err: any) {
      console.error(err);
      toast.error('Could not load AI Mentor');
      throw err;
    }
  }, []);

  const saveProfile = async (profileData: StudentProfile) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mentor/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Failed to save profile');
      return await res.json();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
      const res = await fetch(`${API_URL}/api/mentor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      return data.response;
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to get response');
      throw err;
    }
  };

  return {
    loading,
    getHistory,
    saveProfile,
    sendMessage
  };
};
