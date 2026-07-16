import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { ChevronLeft, MoreVertical, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
                      
                      {app.resumeUrl && (
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
  );
};

export default ATSDashboard;
