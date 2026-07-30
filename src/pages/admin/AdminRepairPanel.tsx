import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Edit, EyeOff, ShieldCheck, Flag, CheckCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'API request failed');
  }
  return response.json();
};

const DashboardTab = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/admin/repair/analytics')
      .then(res => setData(res.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground p-4">Loading analytics...</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalProviders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Global Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.globalAverageRating} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.values(data.requestsByStatus || {}).reduce((a: any, b: any) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Providers by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.providersByCategory || {}).map(([cat, count]: any) => (
                <div key={cat} className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                  <span className="capitalize">{cat}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.requestsByStatus || {}).map(([status, count]: any) => (
                <div key={status} className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                  <span>{status}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProvidersTab = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProviders = async () => {
    try {
      const res = await fetchApi('/api/admin/repair/providers');
      setProviders(res.data);
    } catch (e) {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProviders(); }, []);

  const handleDeactivate = async (id: string, isActive: boolean) => {
    if (!isActive) return toast.info("Already deactivated. Reactivation not supported in UI yet.");
    if (!confirm("Are you sure? This will cancel pending requests for this provider.")) return;
    try {
      await fetchApi(`/api/admin/repair/providers/${id}/deactivate`, { method: 'PUT' });
      toast.success("Provider deactivated");
      loadProviders();
    } catch (e) {
      toast.error("Failed to deactivate");
    }
  };

  const handleVerify = async (id: string, currentVerified: boolean) => {
    if (!confirm(`Mark this provider as ${currentVerified ? 'unverified' : 'verified'}?`)) return;
    try {
      await fetchApi(`/api/admin/repair/providers/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified: !currentVerified })
      });
      toast.success("Verification updated");
      loadProviders();
    } catch (e) {
      toast.error("Failed to update verification");
    }
  };

  const filtered = providers.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search providers by name or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 max-w-sm" />
        </div>
      </div>
      {loading ? <p className="text-muted-foreground p-4">Loading providers...</p> : (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="border-t hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 capitalize">{p.category}</td>
                  <td className="p-3">
                    <Badge variant={p.isActive ? "default" : "destructive"}>
                      {p.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {p.verification?.isVerified ? (
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Verified</Badge>
                    ) : (
                      <span className="text-muted-foreground">Unverified</span>
                    )}
                  </td>
                  <td className="p-3 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleVerify(p._id, p.verification?.isVerified)}>
                      <ShieldCheck className="h-4 w-4 mr-1" /> Verify
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Edit modal coming soon")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {p.isActive && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeactivate(p._id, p.isActive)}>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ModerationTab = () => {
  const [reports, setReports] = useState<{ providerReports: any[], reviewReports: any[] }>({ providerReports: [], reviewReports: [] });
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const res = await fetchApi('/api/admin/repair/reports');
      setReports(res.data);
    } catch (e) {
      toast.error("Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/api/admin/repair/reports/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success("Status updated");
      loadReports();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleHideReview = async (id: string) => {
    if (!confirm("Remove this review from the platform?")) return;
    try {
      await fetchApi(`/api/admin/repair/reviews/${id}/hide`, { method: 'PUT' });
      toast.success("Review removed");
      loadReports();
    } catch (e) {
      toast.error("Failed to hide review");
    }
  };

  return (
    <div className="space-y-8">
      {loading ? <p className="text-muted-foreground p-4">Loading queue...</p> : (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Flag className="h-5 w-5" /> Provider Reports</h3>
            {reports.providerReports.length === 0 ? <p className="text-sm text-muted-foreground p-4 border rounded bg-muted/20">No provider reports.</p> : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.providerReports.map(r => (
                      <tr key={r._id} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{r.providerId?.name || 'Unknown'}</td>
                        <td className="p-3">{r.reasonCategory}</td>
                        <td className="p-3"><Badge variant={r.status === 'Open' ? 'destructive' : 'secondary'}>{r.status}</Badge></td>
                        <td className="p-3 space-x-2">
                          {r.status === 'Open' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(r._id, 'Resolved')}><CheckCircle className="h-4 w-4 mr-1"/> Resolve</Button>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(r._id, 'Dismissed')}><XCircle className="h-4 w-4 mr-1"/> Dismiss</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Flag className="h-5 w-5" /> Flagged Reviews</h3>
            {reports.reviewReports.length === 0 ? <p className="text-sm text-muted-foreground p-4 border rounded bg-muted/20">No flagged reviews.</p> : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Review Snippet</th>
                      <th className="p-3">Flags</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.reviewReports.map(r => (
                      <tr key={r._id} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{r.providerId?.name || 'Unknown'}</td>
                        <td className="p-3 max-w-[200px] truncate">{r.comment}</td>
                        <td className="p-3"><Badge variant="destructive">{r.flagsCount}</Badge></td>
                        <td className="p-3"><Badge variant="outline">{r.moderationStatus}</Badge></td>
                        <td className="p-3 space-x-2">
                          {r.moderationStatus === 'flagged' && (
                            <Button size="sm" variant="destructive" onClick={() => handleHideReview(r._id)}>
                              <EyeOff className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const RequestsTab = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/admin/repair/requests?limit=50')
      .then(res => setRequests(res.data))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {loading ? <p className="text-muted-foreground p-4">Loading requests...</p> : (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">User</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Status</th>
                <th className="p-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r._id} className="border-t hover:bg-muted/50 transition-colors">
                  <td className="p-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{r.userId?.full_name || r.userId?.username || 'Unknown'}</td>
                  <td className="p-3 font-medium">{r.providerId?.name || 'Unknown'}</td>
                  <td className="p-3">
                    <Badge variant={
                      r.status === 'Completed' ? 'default' : 
                      r.status === 'Cancelled' ? 'destructive' : 
                      'secondary'
                    }>{r.status}</Badge>
                  </td>
                  <td className="p-3">{r.quickIssueCategory || 'Custom'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const AdminRepairPanel = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Repair & Maintenance Admin</h1>
          <p className="text-muted-foreground">Manage service providers, handle reports, and view platform requests.</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto h-auto rounded-lg">
            <TabsTrigger value="dashboard" className="rounded-md">Dashboard</TabsTrigger>
            <TabsTrigger value="providers" className="rounded-md">Providers</TabsTrigger>
            <TabsTrigger value="moderation" className="rounded-md">Moderation Queue</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-md">Service Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="m-0 mt-4">
            <DashboardTab />
          </TabsContent>
          
          <TabsContent value="providers" className="m-0 mt-4">
            <ProvidersTab />
          </TabsContent>
          
          <TabsContent value="moderation" className="m-0 mt-4">
            <ModerationTab />
          </TabsContent>
          
          <TabsContent value="requests" className="m-0 mt-4">
            <RequestsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminRepairPanel;
