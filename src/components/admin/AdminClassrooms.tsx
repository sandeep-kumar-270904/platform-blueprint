import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Calendar, ShieldBan, Eye, AlertTriangle, CheckCircle, Activity, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { toast } from 'sonner';

export const AdminClassrooms = () => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/classrooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setClassrooms(await res.json());
      
      const repRes = await fetch(`${API_URL}/api/admin/classrooms/reporting`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (repRes.ok) setReportData(await repRes.json());
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete classroom "${title}"? This cannot be undone and will notify users.`)) return;
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/classrooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Classroom deleted');
        fetchClassrooms();
      } else {
        throw new Error('Deletion failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete classroom');
    }
  };

  const handleSuspendHost = async (hostId: string, hostName: string) => {
    if (!confirm(`Are you sure you want to suspend hosting privileges for "${hostName}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/users/${hostId}/suspend-host`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend: true })
      });
      if (res.ok) {
        toast.success(`Hosting privileges suspended for ${hostName}`);
      } else throw new Error('Suspension failed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend host');
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="management">
        <TabsList className="mb-4">
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="reporting">Platform Reporting</TabsTrigger>
          <TabsTrigger value="moderation">
            Moderation Queue 
            {reportData?.moderation?.pendingReports > 0 && (
              <Badge variant="destructive" className="ml-2">{reportData.moderation.pendingReports}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* MANAGEMENT TAB */}
        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Platform Classrooms</CardTitle>
              <CardDescription>Manage and drill down into individual virtual classrooms.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border rounded-md bg-card">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3">Title & Host</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classrooms.map((c) => (
                      <tr key={c._id || c.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{c.title}</div>
                          <div className="text-xs text-muted-foreground">{c.host_id?.name || c.host_id?.email || 'Unknown Host'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3"/>
                            {new Date(c.scheduled_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize">{c.visibility}</span>
                          {c.is_paid && <span className="ml-2 bg-green-500/10 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Paid</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/classroom/${c._id || c.id}`}><Eye className="h-4 w-4 mr-1" /> View Details</Link>
                            </Button>
                            {c.host_id && (
                              <Button variant="ghost" size="sm" onClick={() => handleSuspendHost(c.host_id._id, c.host_id.name || c.host_id.email)} className="text-amber-600 hover:bg-amber-600/10">
                                <ShieldBan className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(c._id || c.id, c.title)} className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {classrooms.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No classrooms found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTING TAB */}
        <TabsContent value="reporting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-4 border-b bg-muted/10"><CardTitle className="text-sm font-medium flex items-center"><Activity className="w-4 h-4 mr-2"/> Overview</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Classes</span><span className="font-bold">{reportData?.totalClasses || 0}</span></div>
                <div className="flex justify-between"><span>Total Participants</span><span className="font-bold">{reportData?.totalParticipants || 0}</span></div>
                <div className="flex justify-between"><span>Attendance Rate</span><span className="font-bold">{reportData?.attendanceRate || 0}%</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4 border-b bg-muted/10"><CardTitle className="text-sm font-medium flex items-center"><DollarSign className="w-4 h-4 mr-2"/> Revenue</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Transaction Volume</span><span className="font-bold text-green-600">${reportData?.revenue?.totalVolume || 0}</span></div>
                <div className="flex justify-between"><span>Refunds Issued</span><span className="font-bold">{reportData?.revenue?.refunds || 0}</span></div>
                <div className="flex justify-between"><span>Pending Payouts</span><span className="font-bold text-amber-600">${reportData?.revenue?.pendingPayouts || 0}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4 border-b bg-muted/10"><CardTitle className="text-sm font-medium flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> System Health</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Technical Issues (Poor Conn.)</span><span className="font-bold text-red-500">{reportData?.health?.technicalIssues || 0}</span></div>
                <div className="flex justify-between"><span>Join Error Rate</span><span className="font-bold">{reportData?.health?.errorRates?.join || '0%'}</span></div>
                <div className="flex justify-between"><span>Payment Error Rate</span><span className="font-bold">{reportData?.health?.errorRates?.payment || '0%'}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODERATION TAB */}
        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldBan className="text-destructive h-5 w-5" /> Moderation Queue</CardTitle>
              <CardDescription>Review flagged content, pending reports, and hosts under restriction.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6 bg-red-50/50 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                  <h3 className="text-2xl font-bold text-red-900">{reportData?.moderation?.pendingReports || 0}</h3>
                  <p className="text-sm text-red-600">Pending Class Reports</p>
                  <Button variant="outline" size="sm" className="mt-4 border-red-200 text-red-700 hover:bg-red-100">Review Reports</Button>
                </div>
                <div className="border rounded-lg p-6 bg-amber-50/50 flex flex-col items-center justify-center text-center">
                  <ShieldBan className="h-10 w-10 text-amber-500 mb-3" />
                  <h3 className="text-2xl font-bold text-amber-900">{reportData?.moderation?.flaggedHosts || 0}</h3>
                  <p className="text-sm text-amber-700">Restricted Hosts</p>
                  <Button variant="outline" size="sm" className="mt-4 border-amber-200 text-amber-700 hover:bg-amber-100">Manage Hosts</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
