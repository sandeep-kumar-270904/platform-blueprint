import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Database, ShieldAlert, Users, Trash2, CheckCircle, XCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminPlacementPanel = () => {
  const { isAdmin, loading: authLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState("analytics");
  const [stats, setStats] = useState<any>(null);
  const [dsaProblems, setDsaProblems] = useState<any[]>([]);
  const [moderationQueue, setModerationQueue] = useState<any>({ interviewExperiences: [], reports: [] });
  const [referrers, setReferrers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [showDsaForm, setShowDsaForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [dsaForm, setDsaForm] = useState({ title: '', difficulty: 'Easy', topic: '', link: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', category: 'General', file: null as File | null });
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchDsa();
      fetchModeration();
      fetchReferrers();
      fetchResources();
    }
  }, [isAdmin]);

  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/api/placement-resources`, { headers });
      if (res.ok) setResources(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/stats`, { headers });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchDsa = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/dsa`, { headers });
      if (res.ok) setDsaProblems(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchModeration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/moderation`, { headers });
      if (res.ok) setModerationQueue(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchReferrers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/referrers`, { headers });
      if (res.ok) setReferrers(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateDsa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/dsa`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dsaForm)
      });
      if (res.ok) {
        toast({ title: "Success", description: "DSA Problem added" });
        setShowDsaForm(false);
        setDsaForm({ title: '', difficulty: 'Easy', topic: '', link: '' });
        fetchDsa();
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.file) return toast({ title: "Error", description: "File required", variant: "destructive" });
    const data = new FormData();
    data.append("title", resourceForm.title);
    data.append("description", resourceForm.description);
    data.append("category", resourceForm.category);
    data.append("file", resourceForm.file);
    try {
      const res = await fetch(`${API_URL}/api/placement-resources`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: data
      });
      if (res.ok) {
        toast({ title: "Success", description: "Resource uploaded" });
        setShowResourceForm(false);
        setResourceForm({ title: '', description: '', category: 'General', file: null });
        fetchResources();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteDsa = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/dsa/${id}`, { method: 'DELETE', headers });
      if (res.ok) fetchDsa();
    } catch (e) { console.error(e); }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/placement-resources/${id}`, { method: 'DELETE', headers });
      if (res.ok) fetchResources();
    } catch (e) { console.error(e); }
  };

  const handleModerationAction = async (type: string, id: string, action: string) => {
    try {
      const endpoint = type === 'interview' 
        ? `/api/admin/placement/moderation/interview-experience/${id}`
        : `/api/admin/placement/moderation/report/${id}`;
        
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchModeration();
    } catch (e) { console.error(e); }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Placement Preparation Admin</h1>
        <p className="text-muted-foreground mb-8">Manage content, moderation, and analytics for the Placement Preparation module.</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-lg">
            <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="content"><Database className="mr-2 h-4 w-4" /> Content Management</TabsTrigger>
            <TabsTrigger value="moderation">
              <ShieldAlert className="mr-2 h-4 w-4" /> Moderation Queue
              {(moderationQueue.interviewExperiences.length + moderationQueue.reports.length) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {moderationQueue.interviewExperiences.length + moderationQueue.reports.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Users & Referrers</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Users</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats?.activeUsers || 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">DSA Solved</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats?.dsaSolved || 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mocks Booked</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats?.mocksBooked || 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Readiness</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{stats?.avgReadinessScore || 0}%</div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>DSA Problems</CardTitle>
                  <CardDescription>Manage the Data Structures and Algorithms problem bank.</CardDescription>
                </div>
                <Button onClick={() => setShowDsaForm(!showDsaForm)}><Plus className="w-4 h-4 mr-2" /> Add Problem</Button>
              </CardHeader>
              <CardContent>
                {showDsaForm && (
                  <form onSubmit={handleCreateDsa} className="mb-6 p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Title</Label><Input required value={dsaForm.title} onChange={e => setDsaForm({...dsaForm, title: e.target.value})} /></div>
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select value={dsaForm.difficulty} onValueChange={v => setDsaForm({...dsaForm, difficulty: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Topic</Label><Input required value={dsaForm.topic} onChange={e => setDsaForm({...dsaForm, topic: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Link</Label><Input required value={dsaForm.link} onChange={e => setDsaForm({...dsaForm, link: e.target.value})} /></div>
                    </div>
                    <Button type="submit">Save Problem</Button>
                  </form>
                )}
                {dsaProblems.length === 0 ? <p>No problems found.</p> : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {dsaProblems.map(p => (
                      <div key={p._id} className="flex justify-between items-center border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-sm text-muted-foreground">{p.difficulty} • {p.topic}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteDsa(p._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Placement Resources</CardTitle>
                  <CardDescription>Manage official and community study materials.</CardDescription>
                </div>
                <Button onClick={() => setShowResourceForm(!showResourceForm)}><Plus className="w-4 h-4 mr-2" /> Upload Resource</Button>
              </CardHeader>
              <CardContent>
                {showResourceForm && (
                  <form onSubmit={handleCreateResource} className="mb-6 p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Title</Label><Input required value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} /></div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={resourceForm.category} onValueChange={v => setResourceForm({...resourceForm, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="DSA">DSA</SelectItem><SelectItem value="Aptitude">Aptitude</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Company Specific">Company Specific</SelectItem><SelectItem value="General">General</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Description</Label><Textarea required value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} /></div>
                    <div className="space-y-2"><Label>File</Label><Input type="file" required onChange={e => setResourceForm({...resourceForm, file: e.target.files?.[0] || null})} /></div>
                    <Button type="submit">Upload Resource</Button>
                  </form>
                )}
                {resources.length === 0 ? <p>No resources found.</p> : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {resources.map(r => (
                      <div key={r._id} className="flex justify-between items-center border p-4 rounded-lg">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {r.title}
                            {r.isAdminUpload && <Badge variant="outline" className="text-xs h-5">Official</Badge>}
                          </p>
                          <p className="text-sm text-muted-foreground">{r.category} • By {r.uploadedBy?.full_name}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteResource(r._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Pending Interview Experiences</CardTitle></CardHeader>
                <CardContent>
                  {moderationQueue.interviewExperiences.length === 0 ? <p>No pending experiences.</p> : (
                    <div className="space-y-4">
                      {moderationQueue.interviewExperiences.map((exp: any) => (
                        <div key={exp._id} className="border p-4 rounded-lg flex justify-between items-start">
                          <div>
                            <p className="font-bold">{exp.title} ({exp.companyId?.name})</p>
                            <p className="text-sm text-muted-foreground">By {exp.author?.full_name}</p>
                            <p className="mt-2 text-sm">Outcome: {exp.outcome}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleModerationAction('interview', exp._id, 'approve')}><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleModerationAction('interview', exp._id, 'reject')}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Reported Content</CardTitle></CardHeader>
                <CardContent>
                  {moderationQueue.reports.length === 0 ? <p>No pending reports.</p> : (
                    <div className="space-y-4">
                      {moderationQueue.reports.map((r: any) => (
                        <div key={r._id} className="border p-4 rounded-lg flex justify-between items-start">
                          <div>
                            <p className="font-bold capitalize">{r.content_type.replace(/_/g, ' ')}</p>
                            <p className="text-sm">Reason: {r.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">Reported by {r.reported_by?.full_name}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleModerationAction('report', r._id, 'dismiss')}>Dismiss</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleModerationAction('report', r._id, 'action_taken')}>Remove Content</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>Referrer Profiles</CardTitle></CardHeader>
              <CardContent>
                {referrers.length === 0 ? <p>No referrers found.</p> : (
                  <div className="space-y-4">
                    {referrers.map(r => (
                      <div key={r._id} className="flex justify-between items-center border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">{r.user?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{r.companyId?.name} • {r.jobTitle}</p>
                        </div>
                        <Badge variant={r.verificationStatus === 'Verified' ? 'default' : 'secondary'}>
                          {r.verificationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPlacementPanel;
