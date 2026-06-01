import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Users, Calendar, Clock, Plus, Loader2, ExternalLink, LogOut, CheckCircle2, MessageCircle } from "lucide-react";
import { useVirtualClassroom } from "@/hooks/useVirtualClassroom";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { ClassroomChat } from "@/components/classroom/ClassroomChat";

const VirtualClassroom = () => {
  const { user } = useAuth();
  const { classrooms, joined, loading, status, join, leave, create } = useVirtualClassroom();
  const [open, setOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [form, setForm] = useState<any>({ duration_minutes: 60, max_participants: 50 });

  const handleCreate = async () => {
    if (!form.title || !form.scheduled_at) return;
    await create(form);
    setOpen(false);
    setForm({ duration_minutes: 60, max_participants: 50 });
  };

  const isLive = (c: any) => {
    const start = new Date(c.scheduled_at).getTime();
    const end = start + c.duration_minutes * 60000;
    return Date.now() >= start && Date.now() <= end;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Video className="h-7 w-7 text-primary" />Virtual Classroom</h1>
            <p className="text-muted-foreground">Live and scheduled learning sessions.</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={status} />
            {user && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Schedule Class</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Schedule a Classroom</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Title</Label><Input value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><Label>Subject</Label><Input value={form.subject || ""} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div><Label>Scheduled At</Label><Input type="datetime-local" onChange={e => setForm({ ...form, scheduled_at: new Date(e.target.value).toISOString() })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })} /></div>
                      <div><Label>Max Participants</Label><Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: +e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCreate}>Schedule</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-16">
            <Video className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No classrooms scheduled yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map(c => {
              const live = isLive(c);
              const isJoined = joined.has(c.id);
              const full = c.participant_count >= c.max_participants;
              return (
                <Card key={c.id} className="hover-scale">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={live ? "destructive" : "secondary"}>
                        {live && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current animate-pulse" />}
                        {live ? "LIVE" : c.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />{c.participant_count}/{c.max_participants}
                      </div>
                    </div>
                    <h3 className="font-bold line-clamp-2">{c.title}</h3>
                    {c.subject && <Badge variant="outline" className="mt-1 w-fit">{c.subject}</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{new Date(c.scheduled_at).toLocaleString()}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{c.duration_minutes} min</div>
                    {c.description && <p className="text-muted-foreground line-clamp-2">{c.description}</p>}
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap">
                    {isJoined || c.host_id === user?.id ? (
                      <>
                        {c.meeting_link && (
                          <Button variant="default" size="sm" className="flex-1" asChild>
                            <a href={c.meeting_link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Join</a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setChatRoom(c)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {isJoined && (
                          <Button variant="ghost" size="sm" onClick={() => leave(c.id)}><LogOut className="h-4 w-4" /></Button>
                        )}
                      </>
                    ) : (
                      <Button size="sm" className="w-full" disabled={full} onClick={() => join(c.id)}>
                        {full ? "Full" : <><CheckCircle2 className="h-4 w-4 mr-1" />RSVP</>}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!chatRoom} onOpenChange={(o) => !o && setChatRoom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{chatRoom?.title}</DialogTitle></DialogHeader>
          {chatRoom && <ClassroomChat classroomId={chatRoom.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualClassroom;
