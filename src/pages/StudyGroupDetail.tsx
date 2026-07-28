import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Users, Globe, Lock, Shield, Link, Plus, Trash2, Check, X, Trophy } from 'lucide-react';
import { useStudyGroups, StudyGroupDetailType, StudyGroupMembership } from '@/hooks/useStudyGroups';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const StudyGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    fetchGroupDetail, 
    manageMembership, 
    leaveGroup, 
    deleteGroup, 
    addResource, 
    deleteResource 
  } = useStudyGroups();

  const [group, setGroup] = useState<StudyGroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Resource Form
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [isResourceOpen, setIsResourceOpen] = useState(false);

  const loadGroup = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchGroupDetail(id);
      setGroup(data);
    } catch (err) {
      navigate('/study-groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!group || !user) return null;

  const isOwner = group.owner_id === user.id;
  const activeMembers = group.memberships.filter(m => m.status === 'active');
  const pendingMembers = group.memberships.filter(m => m.status === 'pending');

  // Simple leaderboard: Rank by learningStreak + quizStreak
  const leaderboard = [...activeMembers].sort((a, b) => {
    const scoreA = (a.user.learningStreak?.current || 0) + (a.user.quizStreak?.current || 0);
    const scoreB = (b.user.learningStreak?.current || 0) + (b.user.quizStreak?.current || 0);
    return scoreB - scoreA;
  });

  const handleApprove = async (userId: string) => {
    await manageMembership(group._id, userId, 'active');
    loadGroup();
  };

  const handleDeny = async (userId: string) => {
    await manageMembership(group._id, userId, 'rejected');
    loadGroup();
  };

  const handleLeaveOrDelete = async () => {
    if (isOwner) {
      if (confirm("Are you sure you want to permanently delete this group?")) {
        await deleteGroup(group._id);
        navigate('/study-groups');
      }
    } else {
      if (confirm("Are you sure you want to leave this group?")) {
        await leaveGroup(group._id);
        navigate('/study-groups');
      }
    }
  };

  const handleAddResource = async () => {
    if (!resourceTitle || !resourceUrl) return;
    await addResource(group._id, { title: resourceTitle, url: resourceUrl });
    setIsResourceOpen(false);
    setResourceTitle('');
    setResourceUrl('');
    loadGroup();
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (confirm("Delete this resource?")) {
      await deleteResource(group._id, resourceId);
      loadGroup();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Header Section */}
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate('/study-groups')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <Badge variant={group.privacy === 'public' ? 'secondary' : 'outline'}>
                {group.privacy === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {group.privacy}
              </Badge>
              <Badge variant="outline">{group.category}</Badge>
            </div>
            <p className="text-muted-foreground">{group.description}</p>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Users className="w-4 h-4 mr-2" />
              {activeMembers.length} / {group.member_limit} Members
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isOwner && pendingMembers.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative">
                    Manage Requests
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingMembers.length}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pending Join Requests</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {pendingMembers.map(m => (
                      <div key={m.user._id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={m.user.avatar_url} />
                            <AvatarFallback>{m.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{m.user.username}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDeny(m.user._id)}><X className="w-4 h-4 text-red-500" /></Button>
                          <Button size="sm" onClick={() => handleApprove(m.user._id)}><Check className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant={isOwner ? "destructive" : "secondary"} onClick={handleLeaveOrDelete}>
              {isOwner ? "Delete Group" : "Leave Group"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="progress">Members & Progress</TabsTrigger>
            <TabsTrigger value="resources">Shared Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((m, index) => {
                    const score = (m.user.learningStreak?.current || 0) + (m.user.quizStreak?.current || 0);
                    const isGroupOwner = m.role === 'owner';
                    
                    return (
                      <div key={m.user._id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div className="flex items-center gap-4">
                          <div className="w-6 text-center font-bold text-muted-foreground">
                            #{index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={m.user.avatar_url} />
                            <AvatarFallback>{m.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{m.user.username}</span>
                              {isGroupOwner && <Badge variant="secondary" className="text-[10px]"><Shield className="w-3 h-3 mr-1"/> Owner</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">Joined {new Date(m.joinedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{score}</div>
                          <div className="text-xs text-muted-foreground">Total Prep Score</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-xl">Group Resources</CardTitle>
                <Dialog open={isResourceOpen} onOpenChange={setIsResourceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Link</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share a Resource</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Resource Title</Label>
                        <Input value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="e.g. System Design Primer" />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Link</Label>
                        <Input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                    <Button onClick={handleAddResource} disabled={!resourceTitle || !resourceUrl}>Share</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {group.resources.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center border rounded-lg border-dashed text-muted-foreground">
                    <Link className="w-10 h-10 mb-4 opacity-20" />
                    <p>No resources shared yet.</p>
                    <p className="text-sm">Be the first to share a helpful link with the group!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.resources.map(res => {
                      const canDelete = isOwner || res.added_by._id === user.id;
                      return (
                        <div key={res._id} className="flex justify-between items-start p-4 border rounded-lg hover:border-primary/50 transition-colors">
                          <div className="overflow-hidden">
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline block truncate mb-1">
                              {res.title}
                            </a>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              Added by {res.added_by.username}
                            </div>
                          </div>
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDeleteResource(res._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudyGroupDetail;
