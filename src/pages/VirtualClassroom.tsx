import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Users, Calendar, Clock, Plus, Loader2, ExternalLink, LogOut, CheckCircle2, MessageCircle, AlertTriangle, Trash2, Share2, UserPlus, Send } from "lucide-react";
import { useVirtualClassroom } from "@/hooks/useVirtualClassroom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { ClassroomChat } from "@/components/classroom/ClassroomChat";
import { useTranslation } from "react-i18next";
import { formatToTimezone, generateICS, downloadICS } from "@/utils/calendarUtils";
import { supabase } from "@/integrations/supabase/client";

const VirtualClassroom = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { classrooms, joined, loading, status, join, leave, create, remove, loadMore, hasMore } = useVirtualClassroom();
  const [open, setOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const [form, setForm] = useState<any>({ duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0 });
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classrooms/collections`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCollections(data);
      })
      .catch(console.error);
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.scheduled_at) return;
    await create(form);
    setOpen(false);
    setForm({ duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive" });
  };

  const isLive = (c: any) => {
    const start = new Date(c.scheduled_at).getTime();
    const end = start + c.duration_minutes * 60000;
    return Date.now() >= start && Date.now() <= end;
  };

  const handleCheckout = async () => {
    if (!checkoutSession || !user) return;
    setIsProcessingPayment(true);
    
    // Simulate network delay for payment
    await new Promise(r => setTimeout(r, 1500));
    
    // 1. Create Transaction Record
    await supabase.from("virtual_classroom_transactions").insert({
      classroom_id: checkoutSession.id,
      user_id: user.id,
      amount: checkoutSession.price,
      status: 'completed',
      type: 'payment'
    });
    
    // 2. Process RSVP
    await join(checkoutSession.id);
    
    setIsProcessingPayment(false);
    setCheckoutSession(null);
  };

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  const handleShare = async (c: any) => {
    const url = `${window.location.origin}/classroom/${c.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: c.title, text: `Join this live session: ${c.title}`, url });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const handleFollow = async (hostId: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    if (user.id === hostId) return;
    const { error } = await supabase.from("user_follows").insert({ follower_id: user.id, following_id: hostId });
    if (error) {
      if (error.code === '23505') toast({ title: "Already following host" });
      else toast({ title: "Failed to follow", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Host followed!" });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {isOffline && (
          <div className="bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 p-3 rounded-lg mb-6 flex items-center justify-center gap-2 font-medium">
            <AlertTriangle className="h-5 w-5" />
            You are offline. Showing cached upcoming sessions.
          </div>
        )}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Video className="h-7 w-7 text-primary" />{t("Virtual Classroom")}</h1>
            <p className="text-muted-foreground">{t("Live and scheduled learning sessions.")}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={status} />
            {user && (
              <Button variant="outline" asChild>
                <Link to="/host-dashboard">Host Dashboard</Link>
              </Button>
            )}
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interactive">Interactive</SelectItem>
                            <SelectItem value="webinar">Webinar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Visibility</Label>
                        <Select value={form.visibility} onValueChange={v => setForm({ ...form, visibility: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="invite-only">Invite Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t mt-2">
                      <div className="flex items-center gap-2 pt-6">
                        <input 
                          type="checkbox" 
                          id="is_paid" 
                          checked={form.is_paid || false} 
                          onChange={(e) => setForm({ ...form, is_paid: e.target.checked, price: e.target.checked ? form.price || 5 : 0 })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is_paid">Paid Session</Label>
                      </div>
                      <div>
                        <Label>Price ($)</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          disabled={!form.is_paid} 
                          value={form.price || 0} 
                          onChange={e => setForm({ ...form, price: +e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCreate}>Schedule</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        {/* Curated Collections */}
        {collections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-primary">Curated Collections</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {collections.map(col => (
                <Card key={col.id} className="min-w-[280px] bg-primary/5 border-primary/20 shrink-0">
                  <CardHeader className="pb-2">
                    <h3 className="font-bold">{col.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{col.description}</p>
                  </CardHeader>
                  <CardContent className="text-xs font-medium">
                    {col.virtual_classroom_collection_items?.length || 0} Sessions included
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Subject Hubs */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
          {["All", "Technology", "Design", "Business", "Math", "Science"].map(subject => (
            <Button
              key={subject}
              variant={subjectFilter === subject ? "default" : "outline"}
              className="rounded-full shrink-0"
              onClick={() => setSubjectFilter(subject)}
            >
              {subject}
            </Button>
          ))}
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
            {classrooms.filter(c => subjectFilter === "All" || c.subject === subjectFilter).map(c => {
              const live = isLive(c);
              const participation = joined[c.id];
              const isJoined = !!participation;
              const full = c.participant_count >= c.max_participants;
              
              let joinLabel = participation?.status === "waitlisted" ? "Waitlisted" : "Joined";
              if (participation?.status === "attending" && live) joinLabel = "Join Room";

              return (
                <Card key={c.id} className="hover-scale flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={live ? "destructive" : "secondary"} role="status" aria-live="polite">
                        {live && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current animate-pulse" aria-hidden="true" />}
                        {live ? "LIVE" : c.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground" aria-label={`${c.participant_count} out of ${c.max_participants} participants`} role="status" aria-live="polite">
                        <Users className="h-4 w-4" aria-hidden="true" />{c.participant_count}/{c.max_participants}
                      </div>
                    </div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold line-clamp-2">{c.title}</h3>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                          {c.is_featured && <Badge className="bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-400">★ Featured</Badge>}
                          {c.is_paid && <Badge className="bg-green-600 hover:bg-green-700 whitespace-nowrap">${c.price}</Badge>}
                          {participation?.status === "waitlisted" && <Badge variant="outline" className="text-orange-500 border-orange-500">Waitlisted</Badge>}
                        </div>
                      </div>
                      {c.subject && <Badge variant="outline" className="mt-1 w-fit">{c.subject}</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{formatToTimezone(c.scheduled_at, profile?.timezone, profile?.language || 'en')}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{c.duration_minutes} min</div>
                    {c.description && <p className="text-muted-foreground line-clamp-2">{c.description}</p>}
                    
                    {/* Social Proof & Invites */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {c.visibility !== 'invite-only' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleShare(c)}>
                          <Share2 className="h-3 w-3 mr-1" /> Share
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleFollow(c.host_id)}>
                        <UserPlus className="h-3 w-3 mr-1" /> Follow Host
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap pt-4">
                    {isJoined || c.host_id === user?.id ? (
                      <>
                        {participation?.status !== "waitlisted" && (
                          <Button variant={live ? "destructive" : "default"} size="sm" className="flex-1" asChild>
                            <Link to={`/classroom/${c.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {live ? "Enter Classroom" : "Enter Room"}
                            </Link>
                          </Button>
                        )}
                        {participation?.status === "waitlisted" && (
                          <Button variant="secondary" size="sm" className="flex-1" disabled>
                            On Waitlist
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setChatRoom(c)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {isJoined && (
                          <Button variant="ghost" size="sm" onClick={() => leave(c.id)}><LogOut className="h-4 w-4" /></Button>
                        )}
                        {isJoined && !live && (
                          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => downloadICS(c.title, generateICS(c.title, c.description, c.scheduled_at, c.duration_minutes, `${window.location.origin}/classroom/${c.id}`))}>
                            <Calendar className="h-4 w-4 mr-1" /> Add to Calendar
                          </Button>
                        )}
                        {c.host_id === user?.id && (
                          <Button variant="ghost" size="sm" onClick={() => remove(c.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={() => {
                          if (c.is_paid && !full) {
                            setCheckoutSession(c);
                          } else {
                            join(c.id);
                          }
                        }}
                      >
                        {full ? <><Clock className="h-4 w-4 mr-1" />Join Waitlist (Free)</> : <><CheckCircle2 className="h-4 w-4 mr-1" />RSVP {c.is_paid ? `($${c.price})` : ""}</>}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        
        {!loading && hasMore && classrooms.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={loadMore}>
              Load More Sessions
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!chatRoom} onOpenChange={(o) => !o && setChatRoom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{chatRoom?.title}</DialogTitle></DialogHeader>
          {chatRoom && <ClassroomChat classroomId={chatRoom.id} />}
        </DialogContent>
      </Dialog>
      
      {/* Checkout Modal */}
      <Dialog open={!!checkoutSession} onOpenChange={(o) => !o && !isProcessingPayment && setCheckoutSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete RSVP Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold">{checkoutSession?.title}</p>
                <p className="text-sm text-muted-foreground">{checkoutSession?.subject}</p>
              </div>
              <div className="text-xl font-bold">${checkoutSession?.price}</div>
            </div>
            
            <div className="space-y-3 border p-4 rounded-lg">
              <h4 className="text-sm font-semibold">Payment Details (Mocked)</h4>
              <Input placeholder="Card Number" disabled value="**** **** **** 4242" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="MM/YY" disabled value="12/26" />
                <Input placeholder="CVC" disabled value="123" />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              By confirming, you agree to the host's refund policy: {checkoutSession?.refund_policy || 'No refunds within 24 hours of session start.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isProcessingPayment} onClick={() => setCheckoutSession(null)}>Cancel</Button>
            <Button disabled={isProcessingPayment} onClick={handleCheckout}>
              {isProcessingPayment ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : `Pay $${checkoutSession?.price} & RSVP`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualClassroom;
