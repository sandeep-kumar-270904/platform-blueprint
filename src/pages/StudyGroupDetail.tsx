import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Link as LinkIcon, Trash2, Check, X, ShieldAlert, Users, LogOut, Code, FileText, Activity, MessageSquare } from "lucide-react";
import { useStudyGroups, useGroupMessages } from "@/hooks/useStudyGroups";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteManager } from "@/components/study-groups/InviteManager";

const StudyGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    fetchGroupDetails, fetchGroupProgress, addResource, removeResource, 
    approveRequest, removeMember, leave, myGroupIds 
  } = useStudyGroups();
  
  const [group, setGroup] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const [gData, pData] = await Promise.all([
      fetchGroupDetails(id),
      fetchGroupProgress(id)
    ]);
    if (gData) setGroup(gData);
    if (pData) setProgress(pData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!group || !myGroupIds.has(group.id)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Group Not Found or Access Denied</h2>
          <Button onClick={() => navigate('/placement/study-groups')}>Back to Study Groups</Button>
        </div>
      </div>
    );
  }

  const isOwner = group.owner_id === user?.id;

  const handleAddResource = async () => {
    if (!resourceTitle || !resourceUrl) return toast.error("Please fill both title and URL");
    await addResource(group.id, resourceTitle, resourceUrl);
    setResourceTitle("");
    setResourceUrl("");
    loadData();
  };

  const handleRemoveResource = async (resId: string) => {
    await removeResource(group.id, resId);
    loadData();
  };

  const handleApprove = async (userId: string) => {
    await approveRequest(group.id, userId);
    loadData();
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(group.id, userId);
    loadData();
  };

  const handleLeave = async () => {
    await leave(group.id);
    navigate('/placement/study-groups');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-card border p-6 rounded-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <Badge variant={group.privacy === 'public' ? 'secondary' : 'outline'}>{group.privacy}</Badge>
            </div>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <InviteManager groupId={group.id} groupName={group.name} trigger={<Button variant="outline">Invite</Button>} />
            {!isOwner && <Button variant="destructive" onClick={handleLeave}><LogOut className="h-4 w-4 mr-2" /> Leave</Button>}
          </div>
        </div>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="mb-8 overflow-x-auto whitespace-nowrap w-full justify-start md:justify-center border-b rounded-none bg-transparent p-0">
            <TabsTrigger value="progress" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent px-6">Shared Progress</TabsTrigger>
            <TabsTrigger value="discussion" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent px-6">Discussion</TabsTrigger>
            <TabsTrigger value="gd-practice" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent px-6">GD Practice</TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent px-6">Resources</TabsTrigger>
            {isOwner && <TabsTrigger value="manage" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent px-6">Manage Group</TabsTrigger>}
          </TabsList>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Member Progress Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-center"><Code className="h-4 w-4 inline mr-1"/> DSA Solved</TableHead>
                      <TableHead className="text-center"><FileText className="h-4 w-4 inline mr-1"/> Interview Prep</TableHead>
                      <TableHead className="text-center"><Activity className="h-4 w-4 inline mr-1"/> Mock Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progress.sort((a,b) => (b.dsa_solved + b.prep_completed) - (a.dsa_solved + a.prep_completed)).map((p, i) => (
                      <TableRow key={p.user._id}>
                        <TableCell className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground w-4">{i + 1}.</span>
                          <Avatar className="h-8 w-8"><AvatarImage src={p.user.avatar} /><AvatarFallback>{p.user.name[0]}</AvatarFallback></Avatar>
                          <span className="font-medium">{p.user.name} {p.user._id === user?.id && "(You)"}</span>
                        </TableCell>
                        <TableCell className="text-center font-mono">{p.dsa_solved}</TableCell>
                        <TableCell className="text-center font-mono">{p.prep_completed}</TableCell>
                        <TableCell className="text-center font-mono">{p.mock_sessions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>Group Discussion</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <GroupChat groupId={group.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gd-practice">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Live GD Practice Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg mb-6 border">
                  <h3 className="font-bold text-lg mb-2">Schedule a Mock GD</h3>
                  <p className="text-sm text-muted-foreground mb-4">Coordinate a time to hop on a call (Zoom, Meet, Discord) to practice a GD topic. After the session, leave structured peer feedback here.</p>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Topic</label>
                      <Input placeholder="e.g. Impact of AI on Jobs" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Date & Time</label>
                      <Input type="datetime-local" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Meeting Link (optional)</label>
                      <Input placeholder="https://meet.google.com/..." />
                    </div>
                    <Button>Schedule</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Past & Upcoming Sessions</h3>
                  
                  {/* Mock Session Item */}
                  <div className="border rounded-lg p-4 bg-card shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-primary">Is India ready for Electric Vehicles?</h4>
                        <p className="text-sm text-muted-foreground">Scheduled for: Tomorrow at 5:00 PM</p>
                      </div>
                      <Badge>Upcoming</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">RSVP (3 Attending)</Button>
                      <Button variant="outline" size="sm">Join Link</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/30 shadow-sm opacity-80">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg">Moonlighting: Ethical or Not?</h4>
                        <p className="text-sm text-muted-foreground">Completed: Oct 12th</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-2">Peer Feedback Left For You</h5>
                      <div className="bg-card border p-3 rounded-md mb-2">
                        <p className="text-sm"><span className="font-semibold text-green-600">Strengths:</span> Great opening hook, brought everyone back on track.</p>
                        <p className="text-sm mt-1"><span className="font-semibold text-red-600">Improvement:</span> Interrupted John once, make sure to let them finish.</p>
                      </div>
                      <Button variant="link" size="sm" className="px-0">Leave feedback for others</Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Shared Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input placeholder="Resource Title" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} />
                  <Input placeholder="URL (e.g. https://...)" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} />
                  <Button onClick={handleAddResource}>Add</Button>
                </div>
                <div className="space-y-3">
                  {group.shared_resources?.length === 0 && <p className="text-muted-foreground text-center py-8">No resources shared yet.</p>}
                  {group.shared_resources?.map((res: any) => (
                    <div key={res._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        <div>
                          <a href={res.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{res.title}</a>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            Added by {res.added_by?.name} • {new Date(res.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {(isOwner || res.added_by?._id === user?.id) && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveResource(res._id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner && (
            <TabsContent value="manage">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5"/> Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {group.pending_members?.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No pending requests.</p>
                    ) : (
                      <div className="space-y-3">
                        {group.pending_members?.map((m: any) => (
                          <div key={m._id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8"><AvatarImage src={m.avatar} /><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
                              <span>{m.name}</span>
                            </div>
                            <Button size="sm" onClick={() => handleApprove(m._id)}><Check className="h-4 w-4 mr-1"/> Approve</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Manage Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.members?.map((m: any) => (
                        <div key={m._id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8"><AvatarImage src={m.avatar} /><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
                            <span>{m.name} {m._id === group.owner_id && <Badge variant="secondary" className="ml-2">Owner</Badge>}</span>
                          </div>
                          {m._id !== group.owner_id && (
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveMember(m._id)}><X className="h-4 w-4 mr-1"/> Remove</Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

const GroupChat = ({ groupId }: { groupId: string }) => {
  const { user } = useAuth();
  const { messages, send } = useGroupMessages(groupId);
  const [text, setText] = useState("");
  const submit = async () => { if (!text.trim()) return; await send(text); setText(""); };
  return (
    <div className="flex flex-col h-full px-6 pb-6">
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-3 py-2">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet — say hi!</p>
          ) : messages.map(m => (
            <div key={m.id} className={`flex ${m.user_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-lg px-3 py-2 max-w-[75%] text-sm ${m.user_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content}
                <div className="text-xs opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2 pt-3 border-t">
        <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Type a message..." />
        <Button onClick={submit} disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default StudyGroupDetail;
