import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/JobCard';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const JobsPortal = () => {
  const [search, setSearch] = useState('');
  const { jobs, loading } = useJobs({ search });

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col gap-2 border-b pb-4">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Job Portal</h1>
            <p className="text-muted-foreground">Discover internships, entry-level roles, and career opportunities.</p>
          </div>

          <div className="flex gap-4">
            <Input 
              placeholder="Search by job title, company, or skills..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md bg-[var(--surface)]"
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center p-12 bg-[var(--surface)] rounded-lg border border-dashed text-muted-foreground">
              No jobs found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPortal;