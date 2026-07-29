import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface JobRow {
  _id: string;
  title: string;
  company: { name: string; logoUrl?: string; verified: boolean };
  location: string;
  workMode: string;
  jobType: string;
  experienceLevel?: string;
  salary?: { min?: number; max?: number; currency?: string; negotiable?: boolean };
  description: string;
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  skills?: string[];
  openings?: number;
  applyMode: string;
  externalUrl?: string;
  screeningQuestions?: any[];
  status: string;
  createdAt: string;
  postedBy?: any;
  applicantCount?: number;
}

export const useJobs = (filters: any = {}) => {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string manually
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.workMode) params.append('workMode', filters.workMode);
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.minSalary) params.append('minSalary', filters.minSalary);
      if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
      
      const res = await fetch(`${API_URL}/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const postJob = async (jobData: Partial<JobRow>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to post job');
      }
      toast.success("Job posted successfully!");
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return { jobs, total, loading, refetch: fetchJobs, postJob };
};
