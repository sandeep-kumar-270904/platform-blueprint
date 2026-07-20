import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const ModerationDashboard = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/api/community/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApprove = async (postId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/community/admin/reports/${postId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Post approved (reports dismissed)');
        setReports(prev => prev.filter(r => r.post._id !== postId));
      }
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const handleRemove = async (postId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/community/admin/reports/${postId}/remove`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Post removed');
        setReports(prev => prev.filter(r => r.post._id !== postId));
      }
    } catch (e) {
      toast.error('Action failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
        <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="font-semibold text-lg text-foreground mb-2">No pending reports</h3>
        <p>The community feed is looking healthy and clean!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.post._id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Reported Post by {report.post.user_id?.full_name || report.post.user_id?.username || 'Unknown'}
                  <Badge variant="destructive">{report.report_count} Reports</Badge>
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Last reported: {new Date(report.last_reported_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(report.post._id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(report.post._id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 rounded-md text-sm mb-3">
              {report.post.content}
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-1 text-muted-foreground uppercase">Report Reasons:</h4>
              <ul className="text-sm space-y-1">
                {[...new Set(report.reasons as string[])].map((reason: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">• {reason}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
