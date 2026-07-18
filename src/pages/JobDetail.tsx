import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Briefcase, ExternalLink, DollarSign, Clock, Users, ChevronLeft, CheckCircle2, Flag, Bookmark, Share2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useResumes } from '@/hooks/useResume';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const JobDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const { resumes, loading: resumesLoading } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [referring, setReferring] = useState(false);
  const [referEmail, setReferEmail] = useState("");
  const [referMessage, setReferMessage] = useState("");
  const [hasApplied, setHasApplied] = useState(false); // local state for immediate feedback
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowingCompany, setIsFollowingCompany] = useState(false);

  useEffect(() => {
    const fetchJobAndStatuses = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${id}`);
        if (!res.ok) throw new Error('Failed to fetch job details');
        const jobData = await res.json();
        setJob(jobData);
        
        const token = localStorage.getItem('token');
        if (token) {
          const [savedRes, followedRes] = await Promise.all([
            fetch(`${API_URL}/api/jobs/saved`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/companies/followed`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          
          if (savedRes.ok) {
            const savedJobs = await savedRes.json();
            setIsSaved(savedJobs.some((j: any) => j._id === id));
          }
          if (followedRes.ok && jobData.company) {
            const followedCos = await followedRes.json();
            setIsFollowingCompany(followedCos.some((c: any) => c.companyName === jobData.company.name));
          }
        }
      } catch (err) {
        toast.error("Failed to load job details");
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobAndStatuses();
  }, [id, navigate]);

  // Set default resume when modal opens
  useEffect(() => {
    if (isApplyModalOpen && resumes.length > 0 && !selectedResumeId) {
      const defaultRes = resumes.find(r => r.isDefault);
      if (defaultRes) {
        setSelectedResumeId(defaultRes._id as string);
      } else {
        setSelectedResumeId(resumes[0]._id as string);
      }
    }
  }, [isApplyModalOpen, resumes, selectedResumeId]);

  const calculateMatch = (resumeSkills: any[], jobSkills: string[]) => {
    if (!resumeSkills || !jobSkills || jobSkills.length === 0) return 0;
    const flatResumeSkills = resumeSkills.flatMap(s => s.items).map(i => i.toLowerCase());
    const matched = jobSkills.filter(s => flatResumeSkills.includes(s.toLowerCase()));
    return Math.round((matched.length / jobSkills.length) * 100);
  };

  const handleToggleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to save jobs.');
      return;
    }

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/jobs/${id}/save`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update saved status');
      
      toast.success(isSaved ? 'Job removed from saved' : 'Job saved successfully');
      setIsSaved(!isSaved);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("You must be logged in to apply");
      return;
    }

    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeId: selectedResumeId, coverLetter })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Application failed');

      toast.success(data.message || 'Application submitted successfully!');
      setHasApplied(true);
      setIsApplyModalOpen(false);

      if (job.applyMode === 'external' && data.externalUrl) {
        window.open(data.externalUrl, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleEasyApply = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("You must be logged in to apply");
      return;
    }

    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/easy-apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to apply');
      }

      toast.success('Easy Apply successful!');
      setHasApplied(true);
    } catch (err: any) {
      if (err.message.includes('default resume')) {
        toast.error('Please set up your default resume in your profile first.', {
          action: { label: 'Go to Profile', onClick: () => navigate('/dashboard') }
        });
      } else {
        toast.error(err.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleRefer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("You must be logged in to refer someone");
      return;
    }
    
    setReferring(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/jobs/${id}/refer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: referEmail, message: referMessage })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to refer');
      }
      
      toast.success('Referral sent successfully!');
      setIsReferModalOpen(false);
      setReferEmail("");
      setReferMessage("");
    } catch (err: any) {
      toast.error(err.message || 'Error sending referral');
    } finally {
      setReferring(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return toast.error("You must be logged in to report");

    setReporting(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, details: reportDetails })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Report failed');
      toast.success('Report submitted successfully. Thank you.');
      setIsReportModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReporting(false);
    }
  };

  const handleToggleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to follow companies.');
      return;
    }
    try {
      const method = isFollowingCompany ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/companies/${encodeURIComponent(job.company.name)}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update follow status');
      
      toast.success(isFollowingCompany ? 'Company unfollowed' : 'Following company');
      setIsFollowingCompany(!isFollowingCompany);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8 animate-pulse"><div className="h-40 bg-gray-200 rounded-lg mb-8"></div></div>;
  }

  if (!job) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6 -ml-4">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="text-gray-500">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Jobs
        </Button>
        <Button 
          variant="outline" 
          onClick={handleToggleSave}
          className="flex items-center gap-2"
        >
          <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
          {isSaved ? "Saved" : "Save Job"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">{job.title}</h1>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2 font-medium">
                {job.company?.logoUrl ? (
                  <img src={job.company.logoUrl} alt={job.company.name} className="w-6 h-6 object-contain rounded" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
                {job.company?.name}
                {job.postedBy?.recruiterProfile?.verificationStatus === 'verified' ? (
                  <span className="flex items-center gap-1 text-blue-500" title="Verified Recruiter"><CheckCircle2 className="w-4 h-4" /></span>
                ) : (
                  <Badge variant="secondary" className="ml-2 text-[10px] h-4 font-normal">Unverified</Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 h-7 text-xs rounded-full"
                  onClick={handleToggleFollow}
                >
                  {isFollowingCompany ? 'Following' : 'Follow'}
                </Button>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {job.location}
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm py-1 px-3 capitalize"><Briefcase className="w-4 h-4 mr-2" /> {job.workMode}</Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3 capitalize">{job.jobType.replace('-', ' ')}</Badge>
            {job.experienceLevel && <Badge variant="secondary" className="text-sm py-1 px-3 capitalize">{job.experienceLevel} Level</Badge>}
            {job.salary?.min && (
              <Badge variant="secondary" className="text-sm py-1 px-3 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                <DollarSign className="w-4 h-4 mr-1" /> 
                {job.salary.min.toLocaleString()} - {job.salary.max?.toLocaleString()} {job.salary.currency}
              </Badge>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-4">About the Role</h2>
            <p className="whitespace-pre-wrap">{job.description}</p>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-8 mb-4">Key Responsibilities</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {job.responsibilities.map((req: string, i: number) => <li key={i}>{req}</li>)}
                </ul>
              </>
            )}

            {job.skills && job.skills.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-8 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s: string, i: number) => <Badge key={i} variant="outline">{s}</Badge>)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Applicants</p>
                  <p className="text-2xl font-bold flex items-center gap-2 mt-1">
                    <Users className="w-5 h-5 text-gray-400" />
                    {job.applicantCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Views</p>
                  <p className="text-2xl font-bold flex items-center gap-2 mt-1">
                    {job.views || 0}
                  </p>
                </div>
              </div>

              {hasApplied ? (
                <Button className="w-full" disabled variant="secondary">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Applied
                </Button>
              ) : job.applyMode === 'external' ? (
                <Button className="w-full text-lg h-12" onClick={() => handleApply()} disabled={applying}>
                  {applying ? 'Redirecting...' : 'Apply on Company Site'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : (job.applyMode === 'in-app' && (!job.screeningQuestions || job.screeningQuestions.length === 0)) ? (
                <div className="space-y-3">
                  <Button className="w-full text-lg h-12 bg-[#0073b1] hover:bg-[#005582] text-white" onClick={handleEasyApply} disabled={applying}>
                    {applying ? 'Applying...' : 'Easy Apply'}
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    Uses the default resume from your profile.
                  </p>
                </div>
              ) : (
                <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full text-lg h-12">Apply Now</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                      <DialogDescription>Submit your application to {job.company.name}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleApply} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Resume *</Label>
                        {resumesLoading ? (
                          <div className="h-10 bg-muted animate-pulse rounded-md w-full"></div>
                        ) : resumes.length === 0 ? (
                          <div className="text-sm text-red-500 border border-red-200 p-3 rounded bg-red-50">
                            You need to create a resume first. <a href="/resume" className="underline font-medium">Go to Resume Builder</a>
                          </div>
                        ) : (
                          <Select value={selectedResumeId} onValueChange={setSelectedResumeId} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a saved resume" />
                            </SelectTrigger>
                            <SelectContent>
                              {resumes.map(r => {
                                const matchScore = job.skills ? calculateMatch(r.skills || [], job.skills) : 0;
                                return (
                                  <SelectItem key={r._id} value={r._id as string}>
                                    <div className="flex justify-between items-center w-[300px]">
                                      <span>{r.title} {r.isDefault && "(Default)"}</span>
                                      {matchScore > 0 && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{matchScore}% Match</span>}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                        <p className="text-xs text-gray-500">Your resume will be attached as a snapshot.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Cover Letter (Optional)</Label>
                        <Textarea rows={5} placeholder="Tell them why you're a great fit..." value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
                      </div>
                      <Button type="submit" className="w-full" disabled={applying}>
                        {applying ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              
              <Dialog open={isReferModalOpen} onOpenChange={setIsReferModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-2 border-primary/20 hover:bg-primary/5 text-primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Refer a Friend
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Refer Someone for {job.title}</DialogTitle>
                    <DialogDescription>Know someone great for this role? Refer them!</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRefer} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Friend's Email *</Label>
                      <Input type="email" required placeholder="friend@example.com" value={referEmail} onChange={e => setReferEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Why are they a good fit? (Optional)</Label>
                      <Textarea rows={3} placeholder="They have 5 years of experience in..." value={referMessage} onChange={e => setReferMessage(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={referring}>
                      {referring ? 'Sending...' : 'Send Referral'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

            </CardContent>
          </Card>

          {/* Posted By Card */}
          {job.postedBy && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 font-medium mb-4">Posted by</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={job.postedBy.avatar_url || `https://ui-avatars.com/api/?name=${job.postedBy.full_name}&background=random`} 
                    alt="poster" 
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{job.postedBy.full_name}</p>
                    <p className="text-sm text-gray-500">@{job.postedBy.username}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Button */}
          <div className="flex justify-center mt-4">
            <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Flag className="w-4 h-4 mr-2" /> Report this Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Job Posting</DialogTitle>
                  <DialogDescription>Let us know why you are reporting this job. This helps keep our community safe.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReport} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Select value={reportReason} onValueChange={setReportReason}>
                      <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spam">Spam / Duplicate</SelectItem>
                        <SelectItem value="fraud_scam">Fraud / Scam</SelectItem>
                        <SelectItem value="misleading">Misleading Details</SelectItem>
                        <SelectItem value="discriminatory">Discriminatory</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Details (Optional)</Label>
                    <Textarea rows={3} value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Provide any extra context..." />
                  </div>
                  <Button type="submit" variant="destructive" className="w-full" disabled={reporting || !reportReason}>
                    {reporting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
