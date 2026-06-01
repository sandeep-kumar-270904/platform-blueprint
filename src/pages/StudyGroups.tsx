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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Video, MessageSquare, Lock, Globe, Plus, Loader2, Send, LogOut, Link2 } from "lucide-react";
import { useStudyGroups, useGroupMessages, type StudyGroupRow } from "@/hooks/useStudyGroups";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { InviteManager } from "@/components/study-groups/InviteManager";

const StudyGroups = () => {
  const { user } = useAuth();
  const { groups, myGroupIds, loading, status, join, leave, createGroup } = useStudyGroups();
  const [open, setOpen] = useState(false);
  const [chatGroup, setChatGroup] = useState<StudyGroupRow | null>(null);
  const [form, setForm] = useState<any>({ privacy: "public", member_limit: 50 });

  const handleCreate = async () => {
    if (!form.name) return;
    await createGroup(form);
    setOpen(false);
    setForm({ privacy: "public", member_limit: 50 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Study Groups</h1>
            <p className="text-muted-foreground">Join peers, chat, and collaborate live.</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={status} />
            {user && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Create Group</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Study Group</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div><Label>Category</Label><Input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="DSA, Web Dev, AI..." /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Privacy</Label>
                        <Select value={form.privacy} onValueChange={v => setForm({ ...form, privacy: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Member Limit</Label><Input type="number" value={form.member_limit} onChange={e => setForm({ ...form, member_limit: +e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No groups yet — create the first one!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => {
              const isMember = myGroupIds.has(group.id);
              return (
                <Card key={group.id} className="hover-scale">
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
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                    <div className="flex items-center gap-2 text-sm"><Video className="h-4 w-4 text-primary" />{group.active_room_count} active rooms</div>
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap">
                    {isMember ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setChatGroup(group)}><MessageSquare className="h-4 w-4 mr-1" />Chat</Button>
                        <InviteManager
                          groupId={group.id}
                          groupName={group.name}
                          trigger={<Button size="sm" variant="outline"><Link2 className="h-4 w-4" /></Button>}
                        />
                        <Button variant="ghost" size="sm" onClick={() => leave(group.id)}><LogOut className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1" onClick={() => join(group.id)} disabled={group.privacy === "private"}>
                        {group.privacy === "private" ? "Invite Only" : "Join Group"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!chatGroup} onOpenChange={o => !o && setChatGroup(null)}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader><DialogTitle>{chatGroup?.name}</DialogTitle></DialogHeader>
          {chatGroup && <GroupChat groupId={chatGroup.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GroupChat = ({ groupId }: { groupId: string }) => {
  const { user } = useAuth();
  const { messages, send } = useGroupMessages(groupId);
  const [text, setText] = useState("");
  const submit = async () => { if (!text.trim()) return; await send(text); setText(""); };
  return (
    <>
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
    </>
  );
};

export default StudyGroups;
