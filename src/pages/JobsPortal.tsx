import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, MapPin, Briefcase, Search, Plus, ExternalLink, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJobs, JobRow } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { JobCard } from '@/components/JobCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const JobsPortal: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    workMode: '',
    jobType: '',
  });

  const { jobs, loading, postJob } = useJobs(filters);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { user } = useAuth();
  const canPostJob = user && (user.role === 'recruiter' || user.role === 'admin');

  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<JobRow[]>([]);
  
  React.useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [savedRes, recRes] = await Promise.all([
          fetch(`${API_URL}/api/jobs/saved`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/jobs/recommended`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (savedRes.ok) {
          const saved = await savedRes.json();
          setSavedJobIds(saved.map((j: any) => j._id));
        }
        if (recRes.ok) {
          const recs = await recRes.json();
          setRecommendedJobs(recs);
        }
      } catch (err) {
        console.error("Failed to fetch user job data", err);
      }
    };
    fetchUserData();
  }, []);

  const handleToggleSave = (jobId: string, newState: boolean) => {
    if (newState) {
      setSavedJobIds(prev => [...prev, jobId]);
    } else {
      setSavedJobIds(prev => prev.filter(id => id !== jobId));
    }
  };

  // Form state for posting a job
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    location: '',
    workMode: 'onsite',
    jobType: 'full-time',
    description: '',
    applyMode: 'in-app',
    externalUrl: '',
    minSalary: '',
    maxSalary: ''
  });

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await postJob({
      title: formData.title,
      company: { name: formData.companyName, verified: true },
      location: formData.location,
      workMode: formData.workMode,
      jobType: formData.jobType,
      description: formData.description,
      applyMode: formData.applyMode,
      externalUrl: formData.externalUrl,
      salary: {
        min: formData.minSalary ? parseInt(formData.minSalary) : undefined,
        max: formData.maxSalary ? parseInt(formData.maxSalary) : undefined,
        currency: 'INR'
      }
    });
    setIsPostModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Career Opportunities</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Discover your next big career move or post an opening.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/jobs/saved')}>
            Saved Jobs
          </Button>
          <Button variant="outline" onClick={() => navigate('/job-alerts')}>
            Job Alerts
          </Button>
          <Button variant="outline" onClick={() => navigate('/companies/followed')}>
            Following
          </Button>
          <Button variant="outline" onClick={() => navigate('/insights')}>
            Insights
          </Button>
          <Button variant="outline" onClick={() => navigate('/applications')}>
            My Applications
          </Button>
          <Button variant="outline" onClick={() => navigate('/resume/ats-check')}>
            ATS Checker
          </Button>
          {canPostJob && (
            <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a Job</DialogTitle>
                <DialogDescription>Create a new job opportunity for the community.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePostSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Frontend Engineer" />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. Acme Corp" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. New York, NY" />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Mode</Label>
                    <Select value={formData.workMode} onValueChange={v => setFormData({...formData, workMode: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Job Type</Label>
                    <Select value={formData.jobType} onValueChange={v => setFormData({...formData, jobType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Salary (Optional)</Label>
                    <Input type="number" value={formData.minSalary} onChange={e => setFormData({...formData, minSalary: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Salary (Optional)</Label>
                    <Input type="number" value={formData.maxSalary} onChange={e => setFormData({...formData, maxSalary: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea required className="min-h-[100px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Application Mode</Label>
                    <Select value={formData.applyMode} onValueChange={v => setFormData({...formData, applyMode: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-app">Easy Apply (In-App)</SelectItem>
                        <SelectItem value="external">External Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.applyMode === 'external' && (
                    <div className="space-y-2">
                      <Label>External URL</Label>
                      <Input type="url" required value={formData.externalUrl} onChange={e => setFormData({...formData, externalUrl: e.target.value})} />
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">Publish Job</Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="mb-8">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search jobs, skills..." 
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Input 
            placeholder="Location..." 
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          />
          <Select value={filters.workMode} onValueChange={(v) => setFilters(prev => ({ ...prev, workMode: v === 'any' ? '' : v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Work Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Mode</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.jobType} onValueChange={(v) => setFilters(prev => ({ ...prev, jobType: v === 'any' ? '' : v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Save Search Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Job Alert</DialogTitle>
                <DialogDescription>Get notified when new jobs match these filters.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4 pt-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const frequency = formData.get('frequency') as string;
                
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_URL}/api/job-alerts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      name,
                      frequency,
                      criteria: {
                        keywords: filters.search,
                        location: filters.location,
                        workMode: filters.workMode,
                        jobType: filters.jobType
                      }
                    })
                  });
                  if (!res.ok) throw new Error('Failed to create alert');
                  navigate('/job-alerts');
                } catch (err) {
                  console.error(err);
                }
              }}>
                <div className="space-y-2">
                  <Label>Alert Name</Label>
                  <Input name="name" required placeholder="e.g. Remote React Jobs" defaultValue={filters.search ? `${filters.search} Jobs` : ''} />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select name="frequency" defaultValue="daily">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant Notification</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                  <p><strong>Criteria:</strong></p>
                  <ul className="list-disc pl-5 mt-1">
                    {filters.search && <li>Keywords: {filters.search}</li>}
                    {filters.location && <li>Location: {filters.location}</li>}
                    {filters.workMode && <li>Work Mode: {filters.workMode}</li>}
                    {filters.jobType && <li>Job Type: {filters.jobType}</li>}
                    {!filters.search && !filters.location && !filters.workMode && !filters.jobType && (
                      <li>All jobs</li>
                    )}
                  </ul>
                </div>
                <Button type="submit" className="w-full">Create Alert</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Recommended Jobs */}
      {recommendedJobs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
            {recommendedJobs.map(job => (
              <div key={job._id} className="min-w-[300px] w-[350px] shrink-0 snap-start">
                <JobCard 
                  job={job} 
                  isSaved={savedJobIds.includes(job._id)} 
                  onToggleSave={handleToggleSave} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs List */}
      <h2 className="text-2xl font-bold mb-4">All Opportunities</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="animate-pulse h-[300px]"></Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title="No jobs found"
          description="Try adjusting your filters or be the first to post a new opportunity."
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

export default JobsPortal;
