import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { ChevronLeft, MoreVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const COLUMNS = [
  { id: 'applied', title: 'Applied' },
  { id: 'under_review', title: 'Review' },
  { id: 'shortlisted', title: 'Shortlisted' },
  { id: 'interview', title: 'Interview' },
  { id: 'offered', title: 'Offered' },
  { id: 'hired', title: 'Hired' },
  { id: 'rejected', title: 'Rejected' },
];

const ATSDashboard: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState('');

  const fetchApplications = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
      
      const jobRes = await fetch(`${API_URL}/api/jobs/${id}`);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJobTitle(jobData.title);
      }
    } catch (err) {
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const socket = io(API_URL);
    const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
    if (userId) {
      socket.emit('join_recruiter_room', userId);
      socket.on('dashboard:applicationUpdated', (data) => {
        if (data.jobId === id) {
          setApplications(prev => prev.map(app => 
            app._id === data.applicationId ? { ...app, status: data.newStatus } : app
          ));
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const updateStatus = async (applicationId: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    
    // Optimistic UI update
    setApplications(prev => prev.map(app => 
      app._id === applicationId ? { ...app, status: newStatus } : app
    ));

    try {
      const res = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status, reverting...');
      fetchApplications(); // Revert on failure
    }
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, applicationId: string) => {
    e.dataTransfer.setData('applicationId', applicationId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const applicationId = e.dataTransfer.getData('applicationId');
    if (applicationId) {
      const app = applications.find(a => a._id === applicationId);
      if (app && app.status !== status) {
        updateStatus(applicationId, status);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading ATS Dashboard...</div>;
  }

  return (
    <>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-4">Optional: Provide constructive feedback to the applicant.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium">Primary Reason</label>
                <select 
                  className="w-full mt-1 border rounded p-2 dark:bg-gray-700" 
                  value={rejectionFeedback || ''}
                  onChange={e => setRejectionFeedback(e.target.value || null)}
                >
                  <option value="">-- No specific reason --</option>
                  <option value="skills_gap">Skills Gap</option>
                  <option value="experience_level">Experience Level</option>
                  <option value="culture_fit">Culture Fit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Additional Note (Private & Supportive)</label>
                <textarea 
                  className="w-full mt-1 border rounded p-2 dark:bg-gray-700 min-h-[100px]" 
                  value={rejectionFeedbackNote}
                  onChange={e => setRejectionFeedbackNote(e.target.value)}
                  placeholder="e.g. We loved your portfolio, but need more React experience."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmReject}>Reject Applicant</Button>
            </div>
          </div>
        </div>
      )}

    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="p-4 bg-white dark:bg-gray-800 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ATS: {jobTitle}</h1>
            <p className="text-sm text-gray-500">{applications.length} total active applicants</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/recruiter/jobs/${id}/analytics`)}>
          View Analytics
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => (
            <div 
              key={col.id} 
              className="w-80 flex flex-col bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 h-full"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                  {col.title}
                </h3>
                <Badge variant="secondary" className="rounded-full">
                  {applications.filter(a => a.status === col.id).length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {applications.filter(a => a.status === col.id).map(app => (
                  <Card 
                    key={app._id} 
                    className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, app._id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={app.applicant.avatar_url} />
                            <AvatarFallback>{app.applicant.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm leading-tight">{app.applicant.full_name}</p>
                            <p className="text-xs text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {COLUMNS.map(c => (
                              <DropdownMenuItem key={c.id} onClick={() => updateStatus(app._id, c.id)}>
                                Move to {c.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {app.resumeSnapshot ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded w-full justify-center">
                              <FileText className="w-3 h-3" /> View Resume
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{app.applicant.full_name}'s Resume</DialogTitle>
                            </DialogHeader>
                            <div className="bg-white p-8 text-black border rounded shadow-sm min-h-[800px]">
                              {app.resumeSnapshot.showAtsScore && app.resumeSnapshot.atsScore && (
                                <div className="mb-4 p-4 bg-gray-50 border rounded-lg flex justify-between items-center">
                                  <span className="font-semibold text-gray-700">ATS Match Score</span>
                                  <Badge className="text-lg px-3 py-1" variant={app.resumeSnapshot.atsScore.score >= 80 ? 'default' : 'secondary'}>
                                    {app.resumeSnapshot.atsScore.score}
                                  </Badge>
                                </div>
                              )}
                              {/* Resume Content Rendering */}
                              <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold">{app.resumeSnapshot.personalInfo?.fullName}</h1>
                                <p className="text-gray-600">
                                  {app.resumeSnapshot.personalInfo?.email} • {app.resumeSnapshot.personalInfo?.phone} • {app.resumeSnapshot.personalInfo?.location}
                                </p>
                              </div>
                              {app.resumeSnapshot.personalInfo?.professionalSummary && (
                                <div className="mb-6">
                                  <h2 className="text-xl font-semibold border-b pb-1 mb-2">Professional Summary</h2>
                                  <p className="whitespace-pre-wrap text-sm">{app.resumeSnapshot.personalInfo.professionalSummary}</p>
                                </div>
                              )}
                              {app.resumeSnapshot.experience && app.resumeSnapshot.experience.length > 0 && (
                                <div className="mb-6">
                                  <h2 className="text-xl font-semibold border-b pb-1 mb-2">Experience</h2>
                                  <div className="space-y-4">
                                    {app.resumeSnapshot.experience.map((exp: any, i: number) => (
                                      <div key={i}>
                                        <div className="flex justify-between">
                                          <h3 className="font-bold">{exp.title}</h3>
                                          <span className="text-sm text-gray-500">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                        </div>
                                        <p className="italic text-sm">{exp.company} • {exp.location}</p>
                                        <ul className="list-disc pl-5 text-sm mt-1">
                                          {exp.bulletPoints?.map((bp: string, j: number) => <li key={j}>{bp}</li>)}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {app.resumeSnapshot.education && app.resumeSnapshot.education.length > 0 && (
                                <div className="mb-6">
                                  <h2 className="text-xl font-semibold border-b pb-1 mb-2">Education</h2>
                                  <div className="space-y-4">
                                    {app.resumeSnapshot.education.map((edu: any, i: number) => (
                                      <div key={i}>
                                        <div className="flex justify-between">
                                          <h3 className="font-bold">{edu.institution}</h3>
                                          <span className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</span>
                                        </div>
                                        <p className="text-sm">{edu.degree} in {edu.fieldOfStudy}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : app.resumeUrl && (
                        <a 
                          href={app.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded"
                        >
                          <Paperclip className="w-3 h-3" /> View Resume
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-4">Optional: Provide constructive feedback to the applicant.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium">Primary Reason</label>
                <select 
                  className="w-full mt-1 border rounded p-2 dark:bg-gray-700" 
                  value={rejectionFeedback || ''}
                  onChange={e => setRejectionFeedback(e.target.value || null)}
                >
                  <option value="">-- No specific reason --</option>
                  <option value="skills_gap">Skills Gap</option>
                  <option value="experience_level">Experience Level</option>
                  <option value="culture_fit">Culture Fit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Additional Note (Private & Supportive)</label>
                <textarea 
                  className="w-full mt-1 border rounded p-2 dark:bg-gray-700 min-h-[100px]" 
                  value={rejectionFeedbackNote}
                  onChange={e => setRejectionFeedbackNote(e.target.value)}
                  placeholder="e.g. We loved your portfolio, but need more React experience."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmReject}>Reject Applicant</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ATSDashboard;
