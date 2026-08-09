import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronLeft, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getStatusColor = (status: string) => {
  switch(status) {
    case 'applied': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'shortlisted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'interview': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'offered': return 'bg-green-100 text-green-800 border-green-200';
    case 'hired': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Manual Tracking State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/jobs');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/applications/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        }
      } catch (err) {
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();

    // Socket logic
    const socket = io(API_URL);
    const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
    if (userId) {
      socket.emit('join_user_room', userId);
      socket.on('application:statusChanged', (data) => {
        setApplications(prev => prev.map(app => 
          app._id === data.applicationId ? { ...app, status: data.newStatus } : app
        ));
        toast.info(`Application update: Your status for ${data.jobTitle} is now ${data.newStatus.replace('_', ' ')}`);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const withdrawApplication = async (appId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/withdraw`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(prev => prev.map(app => app._id === appId ? { ...app, status: 'withdrawn' } : app));
        toast.success("Application withdrawn");
      }
    } catch (err) {
      toast.error("Failed to withdraw application");
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setAddingManual(true);
    try {
      const res = await fetch(`${API_URL}/api/applications/track`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: manualTitle, company: manualCompany, url: '' })
      });
      if (res.ok) {
        const newApp = await res.json();
        setApplications(prev => [newApp, ...prev]);
        toast.success("Manual application added");
        setIsManualModalOpen(false);
        setManualTitle('');
        setManualCompany('');
      } else {
        throw new Error('Failed to add');
      }
    } catch (err) {
      toast.error("Error adding manual application");
    } finally {
      setAddingManual(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8 max-w-5xl animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-6 -ml-4 text-gray-500">
        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Opportunities
      </Button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Applications</h1>
        
        <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Track Manual</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Track External Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddManual} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input required value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="e.g. Frontend Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input required value={manualCompany} onChange={e => setManualCompany(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addingManual}>{addingManual ? 'Saving...' : 'Save Tracker'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <EmptyState 
          icon={<Briefcase className="h-12 w-12 text-gray-300" />}
          title="No Applications Yet"
          description="You haven't applied to any jobs on StudentHub."
        />
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <Card key={app._id} className="relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(app.status).split(' ')[0]}`} />
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-xl cursor-pointer hover:underline" onClick={() => { if(app.job) navigate(`/jobs/${app.job._id}`)}}>
                      {app.job ? app.job.title : app.studentManagedMetadata?.title || 'Unknown Role'}
                    </h3>
                    <div className="text-gray-500 flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4" /> {app.job ? app.job.company.name : app.studentManagedMetadata?.company || 'Unknown Company'}
                      {app.job && (
                        <>
                          <span>•</span>
                          <MapPin className="w-4 h-4" /> {app.job.location}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Badge className={`${getStatusColor(app.status)} px-3 py-1 uppercase text-xs font-bold tracking-wider`}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-sm text-gray-400">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'hired' && (
                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => {
                      if(confirm('Are you sure you want to withdraw your application?')) withdrawApplication(app._id);
                    }}>
                      Withdraw
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
