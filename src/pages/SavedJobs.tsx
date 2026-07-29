import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { JobCard } from '@/components/JobCard';
import { JobRow } from '@/hooks/useJobs';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SavedJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/jobs/saved`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch saved jobs');
        const data = await res.json();
        setJobs(data);
        setSavedJobIds(data.map((j: any) => j._id));
      } catch (err) {
        console.error(err);
        toast.error("Could not load saved jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchSavedJobs();
  }, [navigate]);

  const handleToggleSave = (jobId: string, newState: boolean) => {
    if (newState) {
      setSavedJobIds(prev => [...prev, jobId]);
    } else {
      setSavedJobIds(prev => prev.filter(id => id !== jobId));
      // Optionally remove it from the list immediately:
      setJobs(prev => prev.filter(job => job._id !== jobId));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-6 -ml-4 text-gray-500">
        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Jobs
      </Button>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Saved Jobs</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse h-[300px] bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState 
          icon={<Briefcase className="h-12 w-12 text-gray-300" />}
          title="No saved jobs"
          description="You haven't saved any jobs yet. Browse the job board and bookmark opportunities you're interested in."
          action={{
            label: "Browse Jobs",
            onClick: () => navigate('/jobs')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <JobCard 
              key={job._id} 
              job={job} 
              isSaved={savedJobIds.includes(job._id)} 
              onToggleSave={handleToggleSave} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
