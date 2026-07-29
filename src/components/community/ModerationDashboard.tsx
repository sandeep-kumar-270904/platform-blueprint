import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const ModerationDashboard = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
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

      const telRes = await fetch(`${API_URL}/api/community/admin/telemetry`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (telRes.ok) {
        setTelemetry(await telRes.json());
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

  return (
    <div className="space-y-6">
      {telemetry && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{telemetry.totalActivePosts}</div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Active Posts</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{telemetry.pendingAutoFlagged}</div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Auto Flagged</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-destructive">{telemetry.pendingUserReports}</div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">User Reports</p>
            </CardContent>
          </Card>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="font-semibold text-lg text-foreground mb-2">No pending reports</h3>
          <p>The community feed is looking healthy and clean!</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};
