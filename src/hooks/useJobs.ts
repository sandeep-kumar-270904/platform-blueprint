import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface JobRow {
  _id?: string;
  id?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  logo: string;
  createdAt?: string;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((j: any) => ({ ...j, id: j._id }));
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();

    const socket = io(API_URL);
    socket.on('job_posted', (newJob) => {
      setJobs((prev) => [{ ...newJob, id: newJob._id }, ...prev]);
      toast.info("A new job has been posted!");
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchJobs]);

  const applyForJob = async (jobId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to apply');
      }
      
      toast.success("Successfully applied for the job!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
      
      if (!res.ok) throw new Error('Failed to post job');
      toast.success("Job posted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return { jobs, loading, refetch: fetchJobs, applyForJob, postJob };
};
