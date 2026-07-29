import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ResumeData {
  _id?: string;
  title: string;
  isDefault: boolean;
  personalInfo: {
    fullName: string; email: string; phone: string; location: string;
    linkedIn: string; github: string; portfolioUrl: string; professionalSummary: string;
  };
  education: any[];
  experience: any[];
  projects: any[];
  skills: any[];
  certifications: any[];
  achievements: any[];
  languages: any[];
  links: any[];
  sectionOrder: string[];
  template: string;
  atsScore: {
    score: number;
    lastCalculatedAt: string | null;
    breakdown: any;
    tips: { issue: string; severity: string; tip: string }[];
  };
  created_at?: string;
  updated_at?: string;
}

export const useResumes = () => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const createResume = async (title?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/resumes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const newResume = await res.json();
        setResumes(prev => [newResume, ...prev]);
        return newResume;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteResume = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResumes(prev => prev.filter(r => r._id !== id));
        toast.success("Resume deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const duplicateResume = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/resumes/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const newResume = await res.json();
        setResumes(prev => [newResume, ...prev]);
        toast.success("Resume duplicated");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const setDefaultResume = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/resumes/${id}/default`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResumes(prev => prev.map(r => ({ ...r, isDefault: r._id === id })));
        toast.success("Default resume updated");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return { resumes, loading, refetch: fetchResumes, createResume, deleteResume, duplicateResume, setDefaultResume };
};

export const useResumeEditor = (resumeId: string | null) => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResume = useCallback(async () => {
    if (!resumeId) {
      setResume(null);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}`, {
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
  }, [resumeId]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const pendingUpdatesRef = useRef<Partial<ResumeData>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateResume = useCallback(async (updates: Partial<ResumeData>) => {
    if (!resumeId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Optimistic update
    setResume(prev => prev ? { ...prev, ...updates } : null);
    
    // Accumulate updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(async () => {
      const payload = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {}; // clear pending

      try {
        await fetch(`${API_URL}/api/resumes/${resumeId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to autosave");
      }
    }, 1000);
  }, [resumeId]);

  const scoreResume = async () => {
    if (!resumeId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/score`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to score");
      }
      const atsScoreData = await res.json();
      setResume(prev => prev ? { ...prev, atsScore: atsScoreData } : null);
      toast.success("Resume scored successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const trackExport = async () => {
    if (!resumeId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/resumes/${resumeId}/export`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return { resume, loading, updateResume, scoreResume, refetch: fetchResume, trackExport };
};

export interface CoverLetter {
  _id: string;
  title: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  content: string;
  tone: string;
  resumeId?: string;
  updatedAt: string;
}

export const useCoverLetters = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoverLetters = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/cover-letters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCoverLetters(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverLetters();
  }, [fetchCoverLetters]);

  const createCoverLetter = async (data: Partial<CoverLetter>) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/cover-letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newLetter = await res.json();
        setCoverLetters(prev => [newLetter, ...prev]);
        return newLetter;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateCoverLetter = async (id: string, data: Partial<CoverLetter>) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/cover-letters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        setCoverLetters(prev => prev.map(cl => cl._id === id ? updated : cl));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCoverLetter = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/cover-letters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCoverLetters(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateCoverLetter = async (resumeId: string, jobDescription: string, tone: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_URL}/api/cover-letters/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ resumeId, jobDescription, tone })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Generation failed');
    }
    
    return await res.json();
  };

  return { coverLetters, loading, refetch: fetchCoverLetters, createCoverLetter, updateCoverLetter, deleteCoverLetter, generateCoverLetter };
};

export const useCoverLetterEditor = (id: string | null) => {
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCoverLetter = useCallback(async () => {
    if (!id) {
      setCoverLetter(null);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/cover-letters/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCoverLetter(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCoverLetter();
  }, [fetchCoverLetter]);

  const updateCoverLetter = async (updates: Partial<CoverLetter>) => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setCoverLetter(prev => prev ? { ...prev, ...updates } : null);
    try {
      await fetch(`${API_URL}/api/cover-letters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error(err);
      fetchCoverLetter();
    }
  };

  return { coverLetter, loading, updateCoverLetter, refetch: fetchCoverLetter };
};
