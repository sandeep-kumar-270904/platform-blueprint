import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface EssayResponse {
  _id: string;
  title: string;
  prompt: string;
  content: string;
  tags: string[];
  timesUsed: number;
}

export const useEssays = () => {
  const [essays, setEssays] = useState<EssayResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEssays = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/essay-bank`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEssays(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load essays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEssays();
  }, [fetchEssays]);

  const addEssay = async (data: Partial<EssayResponse>) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/essay-bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('Essay saved to bank');
        fetchEssays();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      toast.error('Failed to save essay');
      return false;
    }
  };

  const updateEssay = async (id: string, data: Partial<EssayResponse>) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/essay-bank/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('Essay updated');
        fetchEssays();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      toast.error('Failed to update essay');
      return false;
    }
  };

  const deleteEssay = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/essay-bank/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Essay deleted');
        fetchEssays();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete essay');
      return false;
    }
  };

  const adaptEssay = async (id: string, targetScholarshipId: string, targetPromptFieldKey: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/essay-bank/${id}/adapt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetScholarshipId, targetPromptFieldKey })
      });
      if (res.ok) {
        const data = await res.json();
        return data.suggestion;
      }
      return null;
    } catch (err) {
      console.error(err);
      toast.error('Failed to adapt essay');
      return null;
    }
  };

  return {
    essays,
    loading,
    addEssay,
    updateEssay,
    deleteEssay,
    adaptEssay,
    refresh: fetchEssays
  };
};
