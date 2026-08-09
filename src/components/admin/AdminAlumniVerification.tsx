import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ShieldAlert, GraduationCap, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminAlumniVerification: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/alumni/admin/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      } else {
        toast.error('Failed to load alumni verification queue');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    let rejectionReason = '';
    if (status === 'rejected') {
      const reason = prompt('Enter reason for rejection:');
      if (reason === null) return;
      rejectionReason = reason;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/alumni/admin/${id}/verify`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });
      if (res.ok) {
        toast.success(`Profile ${status === 'verified' ? 'approved' : 'rejected'}!`);
        fetchQueue();
      } else {
        toast.error('Action failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading queue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alumni Verification Queue</h2>
          <p className="text-muted-foreground">Review and approve self-reported alumni claims.</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1">{queue.length} Pending</Badge>
      </div>

      {queue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
            <ShieldAlert className="w-12 h-12 text-gray-300" />
            <p>Queue is empty! All alumni claims have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {queue.map((profile) => (
            <Card key={profile._id}>
              <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{profile.userId?.full_name || 'Unknown User'}</span>
                    <span className="text-sm text-muted-foreground">{profile.userId?.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{profile.collegeId?.name}</span>
                    </div>
                    <div>&bull;</div>
                    <div>{profile.branch}</div>
                    <div>&bull;</div>
                    <div>Class of {profile.graduationYear}</div>
                  </div>

                  <div className="flex items-center gap-4 text-sm pt-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.currentRole || 'No Role'} at {profile.currentCompany || 'No Company'}</span>
                    </div>
                    <Badge variant="outline">{profile.visibility}</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerify(profile._id, 'verified')}>
                    <Check className="w-4 h-4 mr-2"/> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVerify(profile._id, 'rejected')}>
                    <X className="w-4 h-4 mr-2"/> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
