import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, CheckCircle2, ShieldBan, XCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminJobsPanel: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const [reportsRes, recruitersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/reports`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/recruiters/pending`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }
      if (recruitersRes.ok) {
        setRecruiters(await recruitersRes.json());
      }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: string, note?: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note })
      });
      if (res.ok) {
        toast.success(`Report actioned: ${action}`);
        fetchData();
      } else {
        toast.error('Action failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleVerifyRecruiter = async (userId: string, approve: boolean) => {
    const note = approve ? '' : window.prompt('Enter rejection reason:');
    if (!approve && !note) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/recruiters/${userId}/verify`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, note })
      });
      if (res.ok) {
        toast.success(`Recruiter ${approve ? 'verified' : 'rejected'}`);
        fetchData();
      } else {
        toast.error('Action failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading admin data...</div>;

  const pendingReports = reports.filter(r => r.status === 'pending');
  const actionedReports = reports.filter(r => r.status !== 'pending');

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Trust & Safety: Job Board</h1>

      <Tabs defaultValue="reports">
        <TabsList className="mb-6">
          <TabsTrigger value="reports">
            Job Reports 
            {pendingReports.length > 0 && <Badge variant="destructive" className="ml-2">{pendingReports.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="recruiters">
            Recruiter Verifications
            {recruiters.length > 0 && <Badge variant="destructive" className="ml-2">{recruiters.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>Jobs flagged by users that need moderation.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending reports.</p>
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <div key={report._id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                          <span className="font-semibold">{report.targetId?.title || 'Unknown Job'}</span>
                          <Badge variant="outline">{report.reason}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Company: {report.targetId?.company?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">Details: {report.details || 'No additional details provided'}</p>
                        <p className="text-xs text-gray-400 mt-2">Reported by: {report.reportedBy?.full_name}</p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/jobs/${report.targetId?._id}`, '_blank')}>
                          View Job
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleReportAction(report._id, 'dismiss')}>
                          Dismiss Report
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReportAction(report._id, 'delete_job', 'Violates community guidelines')}>
                          <Trash2 className="w-4 h-4 mr-2"/> Delete Job
                        </Button>
                        <Button size="sm" className="bg-red-900 hover:bg-red-950" onClick={() => handleReportAction(report._id, 'ban_recruiter', 'Repeated violations')}>
                          <ShieldBan className="w-4 h-4 mr-2"/> Ban Recruiter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruiters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>Recruiters who have requested verified status.</CardDescription>
            </CardHeader>
            <CardContent>
              {recruiters.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending verifications.</p>
              ) : (
                <div className="space-y-4">
                  {recruiters.map((user) => (
                    <div key={user._id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <div className="font-semibold text-lg">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <span className="text-gray-500">Company:</span>
                          <span className="font-medium">{user.recruiterProfile?.companyName}</span>
                          <span className="text-gray-500">Website:</span>
                          <a href={user.recruiterProfile?.companyWebsite} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                            {user.recruiterProfile?.companyWebsite}
                          </a>
                          <span className="text-gray-500">Doc URL:</span>
                          <a href={user.recruiterProfile?.verificationDocUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                            View Document
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleVerifyRecruiter(user._id, false)}>
                          <XCircle className="w-4 h-4 mr-2"/> Reject
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerifyRecruiter(user._id, true)}>
                          <CheckCircle2 className="w-4 h-4 mr-2"/> Verify
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminJobsPanel;
