import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Trash2, ShieldBan, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminModerationQueue: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnifiedReports();
  }, []);

  const fetchUnifiedReports = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/moderation/unified`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        toast.error('Failed to load moderation queue');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, module: string, action: string) => {
    const note = prompt(`Enter reason for ${action}:`);
    if (note === null) return; // User cancelled

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/moderation/unified/${module}/${reportId}/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note })
      });
      if (res.ok) {
        toast.success(`Action applied: ${action}`);
        fetchUnifiedReports();
      } else {
        toast.error('Action failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading moderation queue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Unified Moderation Queue</h2>
          <p className="text-muted-foreground">Manage all reports across all modules in one place.</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-1">{reports.length} Pending</Badge>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
            <ShieldAlert className="w-12 h-12 text-gray-300" />
            <p>Inbox zero! No pending reports across the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report._id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="bg-gray-100">{report.module}</Badge>
                    <Badge variant="destructive">{report.reason}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Reported {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <p className="text-sm font-semibold mb-1">Reporter Comments:</p>
                    <p className="text-sm text-gray-700">{report.details || 'No additional details provided.'}</p>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <div className="text-muted-foreground">
                      <strong>Reporter:</strong> {report.reporter?.full_name || 'Anonymous'} 
                      {report.reporter?.email && ` (${report.reporter?.email})`}
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Target ID:</strong> <code className="bg-gray-100 px-1 rounded">{report.targetId}</code>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Button size="sm" variant="secondary" onClick={() => handleAction(report._id, report.module, 'dismiss')}>
                    Dismiss Report
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction(report._id, report.module, 'confirm_hide')}>
                    <Trash2 className="w-4 h-4 mr-2"/> Hide Content
                  </Button>
                  <Button size="sm" className="bg-red-900 hover:bg-red-950" onClick={() => handleAction(report._id, report.module, 'ban_author')}>
                    <ShieldBan className="w-4 h-4 mr-2"/> Ban Author
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
