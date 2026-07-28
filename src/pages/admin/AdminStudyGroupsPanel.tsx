import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, ShieldAlert, Users, Calendar, Flag, Eye, Trash2, ArrowLeft, Loader2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AdminStudyGroup {
  _id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  member_limit: number;
  member_count: number;
  owner_id: { _id: string, username: string, full_name: string };
  last_activity?: string;
  createdAt: string;
  isFlagged?: boolean;
}

export default function AdminStudyGroupsPanel() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAdmin();
  
  const [groups, setGroups] = useState<AdminStudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [viewGroup, setViewGroup] = useState<AdminStudyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmKickMember, setConfirmKickMember] = useState<{groupId: string, userId: string, username: string} | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchGroups();
    }
  }, [isAdmin]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study-groups`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) {
        setGroups(await res.json());
      } else {
        toast.error("Failed to load study groups.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Server error loading study groups.");
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (id: string, flagged: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study-groups/\${id}/flag`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: flagged })
      });
      
      if (res.ok) {
        toast.success(flagged ? "Group flagged for review." : "Group flag removed.");
        fetchGroups();
      } else {
        toast.error("Failed to update flag status.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study-groups/\${confirmDeleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      
      if (res.ok) {
        toast.success("Group completely disbanded.");
        setConfirmDeleteId(null);
        setViewGroup(null);
        fetchGroups();
      } else {
        toast.error("Failed to delete group.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study-groups/\${groupId}/members`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) {
        setGroupMembers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleKickMember = async () => {
    if (!confirmKickMember) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study-groups/\${confirmKickMember.groupId}/members/\${confirmKickMember.userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      
      if (res.ok) {
        toast.success(\`\${confirmKickMember.username} removed from the group.\`);
        // Refresh members
        fetchMembers(confirmKickMember.groupId);
        setConfirmKickMember(null);
      } else {
        toast.error("Failed to remove member.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.owner_id?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const flaggedGroups = filteredGroups.filter(g => g.isFlagged);

  const renderGroupTable = (dataset: AdminStudyGroup[]) => (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3 font-medium">Group Name</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Members</th>
            <th className="px-4 py-3 font-medium">Status / Privacy</th>
            <th className="px-4 py-3 font-medium">Activity</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {dataset.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                No groups found.
              </td>
            </tr>
          ) : (
            dataset.map(g => {
              const isActive = g.last_activity ? (new Date().getTime() - new Date(g.last_activity).getTime()) / (1000 * 3600 * 24) <= 7 : false;
              
              return (
                <tr key={g._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary line-clamp-1">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.category}</div>
                  </td>
                  <td className="px-4 py-3">{g.owner_id?.username || 'Unknown'}</td>
                  <td className="px-4 py-3">{g.member_count} / {g.member_limit}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={g.privacy === 'public' ? 'secondary' : 'outline'} className="text-[10px]">
                        {g.privacy}
                      </Badge>
                      {g.isFlagged && <Badge variant="destructive" className="text-[10px]">Flagged</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isActive ? <Badge className="bg-green-500 text-[10px]"><Activity className="w-3 h-3 mr-1" aria-hidden="true"/> Active</Badge> : <span className="text-xs text-muted-foreground">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setViewGroup(g); fetchMembers(g._id); }} aria-label="View group details">
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={g.isFlagged ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}
                        onClick={() => handleFlag(g._id, !g.isFlagged)}
                        aria-label={g.isFlagged ? "Remove flag" : "Flag group"}
                      >
                        <Flag className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setConfirmDeleteId(g._id)} aria-label="Delete group">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-200 rounded-full" aria-label="Go back to Admin Panel">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Study Groups Admin</h1>
              <p className="text-muted-foreground text-sm mt-1">Platform-wide visibility and moderation.</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search groups or owners..."
              className="pl-8 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4 bg-white border">
            <TabsTrigger value="all">All Groups</TabsTrigger>
            <TabsTrigger value="moderation">
              Moderation Queue {flaggedGroups.length > 0 && <Badge variant="destructive" className="ml-2">{flaggedGroups.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              renderGroupTable(filteredGroups)
            )}
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              renderGroupTable(flaggedGroups)
            )}
          </TabsContent>
        </Tabs>

      </div>

      {/* View Group Detail Modal */}
      <Dialog open={!!viewGroup} onOpenChange={(open) => !open && setViewGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{viewGroup?.name}</DialogTitle>
            <DialogDescription>{viewGroup?.description}</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Owner</p><p className="font-medium">{viewGroup?.owner_id?.username}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{viewGroup?.category}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Members</p><p className="font-medium">{viewGroup?.member_count} / {viewGroup?.member_limit}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Privacy</p><p className="font-medium capitalize">{viewGroup?.privacy}</p></CardContent></Card>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="w-5 h-5"/> Member Roster</h3>
            {loadingMembers ? (
              <div className="py-4 text-center text-muted-foreground">Loading members...</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers.map(m => (
                      <tr key={m.user._id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium">{m.user.username}</td>
                        <td className="px-4 py-2 capitalize">{m.role}</td>
                        <td className="px-4 py-2">
                          <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:bg-red-50 h-8"
                            onClick={() => setConfirmKickMember({ groupId: viewGroup!._id, userId: m.user._id, username: m.user.username })}
                          >
                            <UserMinus className="w-4 h-4 mr-1" /> Kick
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {groupMembers.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">No members found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-6 flex justify-between w-full sm:justify-between">
            <Button variant="destructive" onClick={() => setConfirmDeleteId(viewGroup!._id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Disband Group
            </Button>
            <Button variant="outline" onClick={() => setViewGroup(null)}>Close View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Disband Study Group
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you absolutely sure you want to permanently delete this study group? This will destroy all chat history, sessions, and remove all members immediately. This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Yes, Disband Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kick Member Confirmation */}
      <Dialog open={!!confirmKickMember} onOpenChange={(open) => !open && setConfirmKickMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserMinus className="w-5 h-5" /> Kick Member
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to forcibly remove <strong>{confirmKickMember?.username}</strong> from this study group?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmKickMember(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleKickMember}>Kick Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
