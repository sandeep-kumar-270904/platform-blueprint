import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Briefcase, DollarSign, Clock, Bookmark } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { JobRow } from '@/hooks/useJobs';

interface JobCardProps {
  job: JobRow;
  isSaved?: boolean;
  onToggleSave?: (jobId: string, newState: boolean) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const JobCard: React.FC<JobCardProps> = ({ job, isSaved = false, onToggleSave }) => {
  const navigate = useNavigate();

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to save jobs.');
      return;
    }

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/jobs/${job._id}/save`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update saved status');
      
      toast.success(isSaved ? 'Job removed from saved' : 'Job saved successfully');
      if (onToggleSave) onToggleSave(job._id, !isSaved);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col relative" onClick={() => navigate(`/jobs/${job._id}`)}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 z-10 bg-white/50 backdrop-blur hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80"
        onClick={handleToggleSave}
      >
        <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
      </Button>

      <CardHeader className="pb-3 flex-row items-start gap-4 space-y-0 pr-12">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border">
          {job.company.logoUrl ? (
            <img src={job.company.logoUrl} alt={job.company.name} className="w-10 h-10 object-contain" />
          ) : (
            <Building2 className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{job.title}</h3>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            {job.company.name}
            {job.postedBy?.recruiterProfile?.verificationStatus === 'verified' ? (
              <span className="ml-1 text-blue-500" title="Verified Recruiter">✓</span>
            ) : (
              <Badge variant="secondary" className="ml-2 text-[10px] h-4 font-normal">Unverified</Badge>
            )}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-3 flex-1">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="font-normal flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {job.location}
          </Badge>
          <Badge variant="secondary" className="font-normal flex items-center gap-1 capitalize">
            <Briefcase className="w-3 h-3" /> {job.workMode}
          </Badge>
          {job.salary?.min && (
            <Badge variant="secondary" className="font-normal flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> 
              {job.salary.min.toLocaleString()} - {job.salary.max?.toLocaleString()} {job.salary.currency || 'INR'}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col items-start text-xs text-gray-500 gap-3">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(job.createdAt).toLocaleDateString()}
          </div>
          <div>
            {job.applicantCount || 0} applicants
          </div>
        </div>
        
        {job.applyMode === 'in-app' && (!job.screeningQuestions || job.screeningQuestions.length === 0) && (
          <Button 
            className="w-full mt-2 bg-[#0073b1] hover:bg-[#005582] text-white" 
            onClick={async (e) => {
              e.stopPropagation();
              const token = localStorage.getItem('token');
              if (!token) {
                toast.error('You must be logged in to apply.');
                return;
              }
              try {
                const res = await fetch(`${API_URL}/api/jobs/${job._id}/easy-apply`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.message || 'Failed to apply');
                }
                toast.success('Successfully applied to job!');
              } catch (err: any) {
                if (err.message.includes('default resume')) {
                  toast.error('Please set up your default resume in your profile first.', {
                    action: { label: 'Go to Profile', onClick: () => navigate('/dashboard') }
                  });
                } else {
                  toast.error(err.message);
                }
              }
            }}
          >
            Easy Apply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
