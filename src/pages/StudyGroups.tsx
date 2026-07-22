import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Lock, Globe, Plus, Loader2 } from "lucide-react";
import { useStudyGroups } from "@/hooks/useStudyGroups";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const StudyGroups = () => {
  const { user } = useAuth();
  const { groups, myGroupIds, loading, status, join, createGroup, requestToJoin } = useStudyGroups();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ privacy: "public", member_limit: 50 });
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!form.name) return toast.error("Study group name is required");
    await createGroup(form);
    setOpen(false);
    setForm({ privacy: "public", member_limit: 50 });
  };

  const myGroups = groups.filter(g => myGroupIds.has(g.id));
  const discoverGroups = groups.filter(g => !myGroupIds.has(g.id));

  const renderGroupCard = (group: any, isMember: boolean) => (
    <Card key={group.id} className="hover-scale flex flex-col cursor-pointer" onClick={() => isMember ? navigate(`/placement/study-groups/${group.id}`) : null}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={group.privacy === "public" ? "secondary" : "outline"}>
            {group.privacy === "public" ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
            {group.privacy}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />{group.member_count}/{group.member_limit}
          </div>
        </div>
        <h3 className="text-xl font-bold">{group.name}</h3>
        {group.category && <Badge variant="outline" className="mt-1 w-fit">{group.category}</Badge>}
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
        <div className="text-xs text-muted-foreground mt-4">Last active: {new Date(group.created_at).toLocaleDateString()}</div>
      </CardContent>
      <CardFooter className="gap-2 flex-wrap">
        {isMember ? (
          <Button variant="default" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/placement/study-groups/${group.id}`); }}>
            View Group
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="w-full" 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (group.privacy === "private") {
                requestToJoin(group.id);
              } else {
                join(group.id); 
              }
            }}
          >
            {group.privacy === "private" ? "Request to Join" : "Join Group"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Peer Study Groups</h1>
            <p className="text-muted-foreground">Join peers, share resources, and track progress together.</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={status} />
            {user && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Create Group</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Study Group</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div><Label htmlFor="description">Description</Label><Textarea id="description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div><Label htmlFor="category">Focus Area</Label><Input id="category" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="DSA, Amazon Prep..." /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Privacy</Label>
                        <Select value={form.privacy} onValueChange={v => setForm({ ...form, privacy: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Invite-Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label htmlFor="member-limit">Member Limit</Label><Input id="member-limit" type="number" value={form.member_limit} onChange={e => setForm({ ...form, member_limit: +e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">You haven't joined any groups yet.</p>
                <Button variant="link" onClick={() => document.querySelector<HTMLButtonElement>('[value="discover"]')?.click()}>
                  Discover groups to join
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map(group => renderGroupCard(group, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : discoverGroups.length === 0 ? (
              <div className="text-center py-16">
                <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No new public groups available to join.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverGroups.map(group => renderGroupCard(group, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudyGroups;
