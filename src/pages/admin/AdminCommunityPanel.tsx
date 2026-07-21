import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFeedMetrics } from "@/components/admin/AdminFeedMetrics";
import { toast } from "sonner";
import { Users, FileText, MessageSquare, AlertTriangle, Activity, Search, ShieldAlert, CheckCircle, Trash2, EyeOff, Pin, Eye } from "lucide-react";

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
    throw new Error(err.message || 'API request failed');
  }
  return response.json();
};

const PostsTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      const data = await fetchApi('/api/admin/community/posts');
      setPosts(data);
    } catch (e) {
      toast.error("Failed to load posts");
    } finally { setLoading(false); }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const updated = await fetchApi(`/api/admin/community/posts/${id}/action`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });
      if (action === 'delete') {
        setPosts(prev => prev.filter(p => p._id !== id));
      } else {
        setPosts(prev => prev.map(p => p._id === id ? { ...p, ...updated } : p));
      }
      toast.success(`Post ${action} successful`);
    } catch (e) {
      toast.error(`Action failed`);
    }
  };

  const filtered = posts.filter(p => 
    p.content?.toLowerCase().includes(search.toLowerCase()) || 
    p.user_id?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Author</th>
                <th className="p-3">Preview</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="border-t hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-medium">{p.user_id?.full_name || 'Unknown'}</td>
                  <td className="p-3 truncate max-w-[200px]">{p.content}</td>
                  <td className="p-3">
                    <Badge variant={p.status === 'active' ? 'default' : p.status === 'hidden' ? 'secondary' : 'destructive'}>
                      {p.status}
                    </Badge>
                    {p.is_pinned && <Badge className="ml-1" variant="outline"><Pin className="h-3 w-3 mr-1"/> Pinned</Badge>}
                  </td>
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleAction(p._id, p.status === 'active' ? 'hide' : 'unhide')}>
                      {p.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction(p._id, p.is_pinned ? 'unpin' : 'pin')}>
                      <Pin className={`h-4 w-4 ${p.is_pinned ? 'text-primary' : ''}`} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction(p._id, 'delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

const CommentsTab = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadComments(); }, []);

  const loadComments = async () => {
    try {
      const data = await fetchApi('/api/admin/community/comments');
      setComments(data);
    } catch (e) { toast.error("Failed to load comments"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/api/admin/community/comments/${id}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c._id !== id));
      toast.success("Comment deleted");
    } catch (e) { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-4">
      {loading ? <p>Loading...</p> : (
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Author</th>
                <th className="p-3">Text</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c._id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{c.user_id?.full_name || 'Unknown'}</td>
                  <td className="p-3">{c.text}</td>
                  <td className="p-3"><Badge>{c.status}</Badge></td>
                  <td className="p-3">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(c._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

const ReportsTab = () => {
  const [reports, setReports] = useState<{posts: any[], comments: any[]}>({ posts: [], comments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const data = await fetchApi('/api/admin/community/reports');
      setReports(data);
    } catch (e) { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  };

  const handleAction = async (type: 'post' | 'comment', id: string, action: string) => {
    try {
      await fetchApi(`/api/admin/community/reports/${type}/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      toast.success(`Report action '${action}' applied`);
      loadReports(); // Reload to remove from queue
    } catch (e) { toast.error("Action failed"); }
  };

  const renderQueue = (items: any[], type: 'post' | 'comment') => {
    if (!items.length) return <p className="text-muted-foreground p-4">No reported {type}s.</p>;
    return (
      <div className="space-y-4">
        {items.map(item => (
          <Card key={item._id} className="border-orange-200 bg-orange-50/30">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">Reports: {item.report_count}</Badge>
                    <span className="font-semibold">{item.user_id?.full_name}</span>
                    <span className="text-xs text-muted-foreground">({type})</span>
                  </div>
                  <p className="text-sm bg-white p-3 rounded border">{item.content || item.text}</p>
                  {item.auto_flag_reason && (
                    <p className="text-xs text-red-500 mt-2">Auto-flagged: {item.auto_flag_reason}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="default" onClick={() => handleAction(type, item._id, 'approve')}>
                    <CheckCircle className="h-4 w-4 mr-2"/> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction(type, item._id, 'remove')}>
                    <Trash2 className="h-4 w-4 mr-2"/> Remove
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(type, item._id, 'warn')}>
                    <AlertTriangle className="h-4 w-4 mr-2"/> Warn User
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {loading ? <p>Loading...</p> : (
        <>
          <div>
            <h3 className="font-semibold text-lg mb-2">Reported Posts</h3>
            {renderQueue(reports.posts, 'post')}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Reported Comments</h3>
            {renderQueue(reports.comments, 'comment')}
          </div>
        </>
      )}
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchApi('/api/admin/community/users');
      setUsers(data);
    } catch (e) { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const updated = await fetchApi(`/api/admin/community/users/${id}/action`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, ...updated } : u));
      toast.success(`User ${action} applied`);
    } catch (e) { toast.error("Action failed"); }
  };

  return (
    <div className="space-y-4">
      {loading ? <p>Loading...</p> : (
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Posts</th>
                <th className="p-3">Reports</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium flex items-center gap-2">
                    {u.full_name || u.username} 
                    {u.community_verified && <Badge variant="default" className="text-[10px]">Verified</Badge>}
                  </td>
                  <td className="p-3">{u.post_count}</td>
                  <td className="p-3 text-red-500">{u.report_count > 0 ? u.report_count : 0}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {u.community_muted && <Badge variant="secondary">Muted</Badge>}
                      {u.community_suspended && <Badge variant="destructive">Suspended</Badge>}
                      {!u.community_muted && !u.community_suspended && <Badge variant="outline">Active</Badge>}
                    </div>
                  </td>
                  <td className="p-3 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleAction(u._id, u.community_muted ? 'unmute' : 'mute')}>
                      {u.community_muted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction(u._id, u.community_suspended ? 'unsuspend' : 'suspend')}>
                      {u.community_suspended ? 'Unsuspend' : 'Suspend'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction(u._id, u.community_verified ? 'unverify' : 'verify')}>
                      {u.community_verified ? 'Unverify' : 'Verify'}
                    </Button>
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

export const AdminCommunityPanel = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Community Admin Panel</h1>
          <p className="text-muted-foreground mt-2">Manage posts, comments, reports, and community users.</p>
        </div>

        <Tabs defaultValue="posts" className="space-y-8">
          <TabsList className="bg-white border p-1 rounded-lg">
            <TabsTrigger value="posts"><FileText className="mr-2 h-4 w-4" /> Posts</TabsTrigger>
            <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4" /> Comments</TabsTrigger>
            <TabsTrigger value="reports"><AlertTriangle className="mr-2 h-4 w-4" /> Reports Queue</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Users</TabsTrigger>
            <TabsTrigger value="analytics"><Activity className="mr-2 h-4 w-4" /> Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="bg-white p-6 rounded-xl border shadow-sm"><PostsTab /></TabsContent>
          <TabsContent value="comments" className="bg-white p-6 rounded-xl border shadow-sm"><CommentsTab /></TabsContent>
          <TabsContent value="reports" className="bg-white p-6 rounded-xl border shadow-sm"><ReportsTab /></TabsContent>
          <TabsContent value="users" className="bg-white p-6 rounded-xl border shadow-sm"><UsersTab /></TabsContent>
          <TabsContent value="analytics" className="bg-white p-6 rounded-xl border shadow-sm"><AdminFeedMetrics /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminCommunityPanel;
