import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ResumeData {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  summary: string;
  ats_score: number;
  ats_tips: { issue: string; severity: string; tip: string }[];
}

export const useResume = (userId: string | undefined | null) => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResume = useCallback(async () => {
    if (!userId) {
      setResume(null);
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/resumes/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResume(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const saveResume = async (resumeData: Partial<ResumeData>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/resumes/me`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save resume');
      }
      
      const savedData = await res.json();
      setResume(savedData);
      toast.success("Resume saved and ATS score updated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return { resume, loading, refetch: fetchResume, saveResume };
};
