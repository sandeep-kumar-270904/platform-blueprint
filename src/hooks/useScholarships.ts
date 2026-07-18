import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Scholarship {
  _id: string;
  title: string;
  provider: string;
  description: string;
  amount: { min?: number; max?: number };
  amountType: string;
  eligibility: {
    minGPA?: number;
    majors?: string[];
    academicLevel?: string[];
    citizenship?: string[];
    location?: string[];
    financialNeedRequired?: boolean;
    otherCriteria?: string[];
  };
  applicationDeadline: string;
  isRecurring: boolean;
  applicationMode: string;
  externalUrl?: string;
  tags: string[];
  viewCount: number;
  saveCount: number;
  applicationCount: number;
  inAppRequirements?: any[];
}

export const useScholarships = (filters: any = {}) => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchScholarships = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) queryParams.append(key, String(val));
      });

      const res = await fetch(`${API_URL}/api/scholarships?${queryParams.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setScholarships(data.scholarships);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const toggleSave = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to save scholarships');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/scholarships/${id}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.saved ? 'Saved!' : 'Removed from saved');
        return data.saved;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMatchExplanation = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/scholarships/${id}/match-explanation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.explanation;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  return { scholarships, total, loading, refetch: fetchScholarships, toggleSave, getMatchExplanation };
};
