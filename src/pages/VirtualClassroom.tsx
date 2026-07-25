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
import { Video, Users, Calendar, Clock, Plus, Loader2, ExternalLink, LogOut, CheckCircle2, MessageCircle, AlertTriangle, Trash2, Share2, UserPlus, Send, Search, Bell, BellRing, Star, Edit, PlayCircle } from "lucide-react";
import { useVirtualClassroom } from "@/hooks/useVirtualClassroom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { ClassroomChat } from "@/components/classroom/ClassroomChat";
import { useTranslation } from "react-i18next";
import { formatToTimezone, generateICS, downloadICS } from "@/utils/calendarUtils";

const VirtualClassroom = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { classrooms, joined, loading, error, status, join, leave, create, remove, loadMore, hasMore, refetch, toggleReminder, submitRating, addRecording, editClassroom, cancelClassroom } = useVirtualClassroom();
  const [open, setOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discountStatus, setDiscountStatus] = useState<any>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  const [form, setForm] = useState<any>({ duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0, is_series: false, series_count: 1, series_frequency: 'weekly', co_host_emails: [], tags: [], prerequisite_classes_str: '', discount_codes_str: '', language: 'English', status: 'scheduled' });
  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingDialog, setRatingDialog] = useState<any>(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, feedback: "", technical_issue: false, technical_issue_details: "" });
  const [editDialog, setEditDialog] = useState<any>(null);
  const [recordingDialog, setRecordingDialog] = useState<any>(null);
  const [materialDialog, setMaterialDialog] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({ title: '', url: '' });
  const [announcementDialog, setAnnouncementDialog] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({ message: '' });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classrooms/collections`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCollections(data);
      })
      .catch(console.error);
  }, []);

  const handleCreate = async () => {
    if (!form.title) return toast({ title: "Class title is required", variant: "destructive" });
    if (!form.scheduled_at) return toast({ title: "Schedule time is required", variant: "destructive" });
    
    const payload = { ...form };
    if (typeof payload.co_host_emails === 'string') {
      payload.co_host_emails = payload.co_host_emails.split(',').map((e: string) => e.trim()).filter(Boolean);
    }
    if (typeof payload.tags === 'string') {
      payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (payload.discount_codes_str) {
      payload.discount_codes = payload.discount_codes_str.split(',').map((d: string) => {
        const [code, percent_off, max_uses] = d.split(':');
        return { code: code.trim().toUpperCase(), percent_off: parseInt(percent_off) || 10, max_uses: parseInt(max_uses) || 0 };
      }).filter((d: any) => d.code);
    }

    if (payload.prerequisite_classes_str) {
      payload.prerequisite_classes = payload.prerequisite_classes_str.split(',').map((id: string) => id.trim()).filter(Boolean);
    }

    await create(payload);
    setOpen(false);
    setForm({ duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0, is_series: false, series_count: 1, series_frequency: 'weekly', co_host_emails: [], tags: [], prerequisite_classes_str: '', language: 'English', status: 'scheduled' });
  };

    const handleJoinAttempt = async (c: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classrooms/check-conflict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: c.scheduled_at, duration_minutes: c.duration_minutes, role: 'participant' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conflict) {
          setConflictWarning(`You are already scheduled for "${data.conflicting_class}" at this time. Are you sure you want to RSVP?`);
          setPendingJoin(() => () => join(c.id, c.is_paid ? 'mock_token' : undefined));
          return;
        }
      }
      join(c.id, c.is_paid ? 'mock_token' : undefined);
    } catch (err) {
      join(c.id, c.is_paid ? 'mock_token' : undefined);
    }
  };
  const isLive = (c: any) => {
    const start = new Date(c.scheduled_at).getTime();
    const end = start + c.duration_minutes * 60000;
    return Date.now() >= start && Date.now() <= end;
  };

  const handleCheckout = async () => {
    if (!checkoutSession || !user) return;
    setIsProcessingPayment(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const amountToCharge = discountStatus?.discounted_price !== undefined ? discountStatus.discounted_price : checkoutSession.price;
      
      await fetch(`${API_URL}/api/classrooms/${checkoutSession.id}/transactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToCharge, discount_code: discountStatus?.code })
      });
      
      await join(checkoutSession.id);
      setCheckoutSession(null);
      setPromoCode("");
      setDiscountStatus(null);
      toast({ title: "RSVP Complete", description: "You have joined the class." });
    } catch {
      toast({ title: "Checkout failed", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode || !checkoutSession) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${checkoutSession.id}/apply-discount`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() })
      });
      const data = await res.json();
      if (res.ok) {
        setDiscountStatus(data);
        toast({ title: "Promo applied!" });
      } else {
        toast({ title: data.message || "Invalid promo code", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error applying code", variant: "destructive" });
    }
  };

  const handleRefundRequest = async (classroomId: string) => {
    if (!confirm("Are you sure you want to request a refund and leave this class?")) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/refund`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Refund Requested", description: data.message });
        refetch();
      } else {
        toast({ title: "Refund failed", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
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

    const markExternalAttendance = async (classroomId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/classrooms/${classroomId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async (hostId: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    if (user.id === hostId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/${hostId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Host followed!" });
      } else {
        const data = await res.json();
        if (data.message === 'Already following host') {
          toast({ title: "Already following host" });
        } else {
          toast({ title: "Failed to follow", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Failed to follow", variant: "destructive" });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {isOffline && (
          <div className="bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 p-3 rounded-lg mb-6 flex items-center justify-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            You are offline. Showing cached upcoming sessions.
          </div>
        )}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Video className="h-6 w-6 text-primary" />{t("Virtual Classroom")}</h1>
            <p className="text-muted-foreground">{t("Live and scheduled learning sessions.")}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={status} />
            {user && (
              <Link to="/host-dashboard">
                <Button variant="outline">Host Dashboard</Button>
              </Link>
            )}
            {user && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Schedule Class</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Schedule a Classroom</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={form.subject || ""} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                    <div><Label htmlFor="description">Description</Label><Textarea id="description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div><Label htmlFor="scheduled-at">Scheduled At</Label><Input id="scheduled-at" type="datetime-local" onChange={e => setForm({ ...form, scheduled_at: new Date(e.target.value).toISOString() })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label htmlFor="duration-min">Duration (min)</Label><Input id="duration-min" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })} /></div>
                      <div><Label htmlFor="max-participants">Max Participants</Label><Input id="max-participants" type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: +e.target.value })} /></div>
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
                        <Label htmlFor="price">Price ($)</Label><Input id="price" 
                          type="number" 
                          min="1" 
                          disabled={!form.is_paid} 
                          value={form.price || 0} 
                          onChange={e => setForm({ ...form, price: +e.target.value })} 
                        />
                      </div>
                    </div>
                    {form.is_paid && (
                      <div className="pt-2 border-t mt-2">
                        <Label htmlFor="discount-codes">Discount Codes (Optional)</Label>
                        <Input id="discount-codes" placeholder="SUMMER:20:100 (Code:Percent:MaxUses), ..." value={form.discount_codes_str || ''} onChange={e => setForm({ ...form, discount_codes_str: e.target.value })} />
                        <p className="text-[10px] text-muted-foreground mt-1">Format: CODE:PERCENT_OFF:MAX_USES, separated by commas.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t mt-2">
                      <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" id="is_series" checked={form.is_series} onChange={(e) => setForm({ ...form, is_series: e.target.checked })} className="h-4 w-4" />
                        <Label htmlFor="is_series">Recurring Series</Label>
                      </div>
                      {form.is_series && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Sessions</Label>
                            <Input type="number" min="2" max="10" value={form.series_count} onChange={e => setForm({ ...form, series_count: +e.target.value })} />
                          </div>
                          <div>
                            <Label>Freq</Label>
                            <Select value={form.series_frequency} onValueChange={v => setForm({ ...form, series_frequency: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t mt-2 space-y-3">
                      <div><Label>Co-Hosts (Emails, comma separated)</Label><Input placeholder="host2@example.com, host3@example.com" value={typeof form.co_host_emails === 'string' ? form.co_host_emails : form.co_host_emails.join(', ')} onChange={e => setForm({ ...form, co_host_emails: e.target.value })} /></div>
                      <div><Label>Tags (comma separated)</Label><Input placeholder="react, typescript, beginners" value={typeof form.tags === 'string' ? form.tags : form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
                      <div><Label>Prerequisite Class IDs (comma separated)</Label><Input placeholder="ObjectId1, ObjectId2" value={form.prerequisite_classes_str || ''} onChange={e => setForm({ ...form, prerequisite_classes_str: e.target.value })} /></div>
                      <div>
                        <Label>Language</Label>
                        <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="Mandarin">Mandarin</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => { setForm({ ...form, status: 'draft' }); setTimeout(handleCreate, 0); }}>Save as Draft</Button>
                    <Button onClick={() => { setForm({ ...form, status: 'scheduled' }); setTimeout(handleCreate, 0); }}>Publish</Button>
                  </DialogFooter>
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

        {/* Subject Hubs and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar flex-1">
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
          <div className="flex items-center gap-2 shrink-0 md:w-auto">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[120px] rounded-full">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Languages</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Mandarin">Mandarin</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative shrink-0 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search classes..." 
                className="pl-9 rounded-full bg-background" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && refetch(false, searchQuery)}
              />
            </div>
          </div>
        </div>

        {(() => {
          const filteredClassrooms = classrooms.filter(c => 
            (subjectFilter === "All" || c.subject === subjectFilter) &&
            (languageFilter === "All" || c.language === languageFilter)
          );

          if (error) {
            return (
              <div className="text-center py-16 border rounded-lg bg-destructive/10 border-destructive/20 text-destructive mb-8">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                <p className="font-medium">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            );
          }

          if (loading) {
            return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
          }

          if (filteredClassrooms.length === 0) {
            return (
              <div className="text-center py-16">
                <Video className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No classrooms scheduled for {subjectFilter === "All" ? "now" : subjectFilter}.</p>
              </div>
            );
          }

          return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClassrooms.map(c => {
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
                      <div className="flex items-center gap-2">
                        <Badge variant={c.status === 'draft' ? "outline" : (live ? "destructive" : "secondary")} role="status" aria-live="polite">
                          {live && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current animate-pulse" aria-hidden="true" />}
                          {live ? "LIVE" : c.status.toUpperCase()}
                        </Badge>
                        {c.language && <Badge variant="outline" className="text-xs bg-muted/50">{c.language}</Badge>}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${full ? 'text-destructive font-bold' : 'text-muted-foreground'}`} aria-label={`${c.participant_count} out of ${c.max_participants} participants`} role="status" aria-live="polite">
                        <Users className="h-4 w-4" aria-hidden="true" />{c.participant_count}/{c.max_participants} {full && "(Full)"}
                      </div>
                    </div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold line-clamp-2">{c.title}</h3>
                          {c.series_total > 1 && (
                            <Badge variant="outline" className="mt-1 text-xs text-muted-foreground border-primary/20">
                              Series ({c.series_index}/{c.series_total})
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                          {c.is_featured && <Badge className="bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-400">★ Featured</Badge>}
                          {c.is_paid && <Badge className="bg-green-600 hover:bg-green-700 whitespace-nowrap">${c.price}</Badge>}
                          {participation?.status === "waitlisted" && <Badge variant="outline" className="text-orange-500 border-orange-500">Waitlisted</Badge>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        {c.subject && <Badge variant="outline" className="w-fit">{c.subject}</Badge>}
                        {c.rating_count > 0 && (
                          <div className="flex items-center text-sm font-medium text-amber-500">
                            <Star className="h-4 w-4 fill-amber-500 mr-1" />
                            {c.rating_avg?.toFixed(1)} ({c.rating_count})
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        {c.host_id?.avatar ? (
                          <img src={c.host_id.avatar} alt="host" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                            {(c.host_id?.first_name?.[0] || 'H')}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Hosted by {c.host_id?.first_name} {c.host_id?.last_name}
                          {c.host_id?.is_verified_host && <CheckCircle2 className="h-3 w-3 text-blue-500" title="Verified Host" />}
                        </span>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{formatToTimezone(c.scheduled_at, profile?.timezone, profile?.language || 'en')}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{c.duration_minutes} min</div>
                    {c.description && <p className="text-muted-foreground line-clamp-2">{c.description}</p>}
                    
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] py-0">{tag}</Badge>
                        ))}
                        {c.tags.length > 3 && <Badge variant="secondary" className="text-[10px] py-0">+{c.tags.length - 3}</Badge>}
                      </div>
                    )}
                    
                    {/* Social Proof & Invites */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {c.visibility !== 'invite-only' && (
                        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleShare(c)}>
                          <Share2 className="h-3 w-3 mr-1" /> Share
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleFollow(c.host_id)}>
                        <UserPlus className="h-3 w-3 mr-1" /> Follow Host
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap pt-4">
                    {c.host_id === user?.id ? (
                      // Host tools
                      <>
                        <Link to={`/classroom/${c.id}`} className="flex-1">
                          <Button variant={live ? "destructive" : "default"} size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {live ? "Enter Classroom" : "Enter Room"}
                          </Button>
                        </Link>
                        {c.status === "completed" ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setRecordingDialog(c)}>
                                <PlayCircle className="h-4 w-4 mr-2" /> Add Recording
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setMaterialDialog(c)}>
                                <ExternalLink className="h-4 w-4 mr-2" /> Add Material
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setAnnouncementDialog(c)}>
                                <Bell className="h-4 w-4 mr-2" /> Add Announcement
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => cancelClassroom(c.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Cancel Session
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setEditDialog(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => cancelClassroom(c.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </>
                    ) : isJoined ? (
                      // Participant tools
                      <>
                        {participation?.status !== "waitlisted" && (
                          c.external_video_url ? (
                            <a href={c.external_video_url} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={() => markExternalAttendance(c.id)}>
                              <Button variant={live ? "destructive" : "default"} size="sm" className="w-full">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                {live ? "Join External Live" : "Open Link"}
                              </Button>
                            </a>
                          ) : (
                            <Link to={`/classroom/${c.id}`} className="flex-1">
                              <Button variant={live ? "destructive" : "default"} size="sm" className="w-full">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                {live ? "Enter Classroom" : "Enter Room"}
                              </Button>
                            </Link>
                          )
                        )}
                        {participation?.status === "waitlisted" && (
                          <Button variant="secondary" size="sm" className="flex-1" disabled>
                            On Waitlist
                          </Button>
                        )}
                        
                        {c.status === "completed" && c.recording_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(c.recording_url, '_blank')}>
                            <PlayCircle className="h-4 w-4 mr-1" /> Watch
                          </Button>
                        )}
                        {c.status === "completed" && participation?.status === "attending" && (
                          <Button variant="outline" size="sm" onClick={() => setRatingDialog(c)}>
                            <Star className="h-4 w-4 mr-1" /> Rate
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => setChatRoom(c)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {!live && c.status !== "completed" && (
                           <Button 
                             variant={participation?.reminders_opt_in ? "default" : "outline"} 
                             size="sm" 
                             onClick={() => toggleReminder(c.id)}
                           >
                             {participation?.reminders_opt_in ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                           </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => leave(c.id)}><LogOut className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <div className="w-full flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant={c.participant_count >= c.max_participants ? "secondary" : "default"}
                          className="w-full"
                          disabled={isOffline}
                          onClick={() => c.is_paid ? setCheckoutSession(c) : join(c.id)}
                        >
                          {full ? <><Clock className="h-4 w-4 mr-1" aria-hidden="true" />Join Waitlist (Free)</> : <><CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />RSVP {c.is_paid ? `($${c.price})` : ""}</>}
                        </Button>
                        {c.parent_series_id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                            disabled={isOffline || c.is_paid}
                            onClick={() => join(c.id, true)}
                          >
                            <Calendar className="h-4 w-4 mr-1" aria-hidden="true" /> Join Full Series
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Add to Calendar button in a separate row if not live and not completed */}
                    {isJoined && !live && c.status !== "completed" && c.host_id !== user?.id && (
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => downloadICS(c.title, generateICS(c.title, c.description, c.scheduled_at, c.duration_minutes, `${window.location.origin}/classroom/${c.id}`))}>
                        <Calendar className="h-4 w-4 mr-1" /> Add to Calendar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          );
        })()}
        
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
            
            <div className="flex gap-2">
              <Input placeholder="Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <Button variant="secondary" onClick={handleApplyPromo}>Apply</Button>
            </div>
            {discountStatus && (
              <p className="text-sm text-green-600 font-medium">Promo applied! New price: ${discountStatus.discounted_price}</p>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              By confirming, you agree to the host's refund policy: {checkoutSession?.refund_policy || 'Refunds up to 24 hours before class.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isProcessingPayment} onClick={() => { setCheckoutSession(null); setPromoCode(""); setDiscountStatus(null); }}>Cancel</Button>
            <Button disabled={isProcessingPayment} onClick={handleCheckout}>
              {isProcessingPayment ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : `Pay $${discountStatus?.discounted_price !== undefined ? discountStatus.discounted_price : checkoutSession?.price} & RSVP`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Modal */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Classroom</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={editDialog?.title || ""} onChange={e => setEditDialog({ ...editDialog, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={editDialog?.description || ""} onChange={e => setEditDialog({ ...editDialog, description: e.target.value })} /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={editDialog?.duration_minutes || 60} onChange={e => setEditDialog({ ...editDialog, duration_minutes: +e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              editClassroom(editDialog.id, { title: editDialog.title, description: editDialog.description, duration_minutes: editDialog.duration_minutes });
              setEditDialog(null);
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recording Modal */}
      <Dialog open={!!recordingDialog} onOpenChange={(o) => !o && setRecordingDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Session Recording</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Recording URL (YouTube, Vimeo, etc.)</Label>
            <Input 
              value={recordingDialog?.recording_url || ""} 
              onChange={e => setRecordingDialog({ ...recordingDialog, recording_url: e.target.value })} 
              placeholder="https://..." 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordingDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              addRecording(recordingDialog.id, recordingDialog.recording_url);
              setRecordingDialog(null);
            }}>Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      <Dialog open={!!ratingDialog} onOpenChange={(o) => !o && setRatingDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rate this Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating (1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Button 
                    key={star} 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto" 
                    onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                  >
                    <Star className={`h-8 w-8 ${ratingForm.rating >= star ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Feedback (Optional)</Label>
              <Textarea 
                placeholder="What did you think of this class?"
                value={ratingForm.feedback}
                onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
              />
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="tech_issue" 
                  checked={ratingForm.technical_issue} 
                  onChange={(e) => setRatingForm({ ...ratingForm, technical_issue: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="tech_issue" className="text-destructive font-semibold">I experienced a technical issue</Label>
              </div>
              {ratingForm.technical_issue && (
                <div className="mt-2">
                  <Textarea 
                    placeholder="Please describe the issue (audio, video, disconnects, etc.)"
                    value={ratingForm.technical_issue_details}
                    onChange={(e) => setRatingForm({ ...ratingForm, technical_issue_details: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              submitRating(ratingDialog.id, ratingForm.rating, ratingForm.feedback, ratingForm.technical_issue, ratingForm.technical_issue_details);
              setRatingDialog(null);
              setRatingForm({ rating: 5, feedback: "", technical_issue: false, technical_issue_details: "" });
            }}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Modal */}
      <Dialog open={!!materialDialog} onOpenChange={(o) => !o && setMaterialDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class Material</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Material Title</Label>
              <Input placeholder="e.g. Lecture Slides" value={materialForm.title} onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })} />
            </div>
            <div>
              <Label>URL</Label>
              <Input placeholder="https://..." value={materialForm.url} onChange={e => setMaterialForm({ ...materialForm, url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              addMaterial(materialDialog.id, materialForm.title, materialForm.url);
              setMaterialDialog(null);
              setMaterialForm({ title: '', url: '' });
            }}>Add Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Modal */}
      <Dialog open={!!announcementDialog} onOpenChange={(o) => !o && setAnnouncementDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Announcement Message</Label>
              <Textarea 
                placeholder="Important updates for the class..."
                value={announcementForm.message} 
                onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              addAnnouncement(announcementDialog.id, announcementForm.message);
              setAnnouncementDialog(null);
              setAnnouncementForm({ message: '' });
            }}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      {historyDialog && (
        <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>My Class History</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {historyData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No past classes found.</p>
              ) : (
                historyData.map((c: any) => (
                  <Card key={c.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                    <div>
                      <h4 className="font-bold">{c.title}</h4>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" /> 
                        {formatToTimezone(c.scheduled_at, profile?.timezone, profile?.language || 'en')}
                      </div>
                      {c.host_id?._id === user?.id && <Badge variant="outline" className="mt-2">Hosted by me</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadCertificate(c.id)}>
                        Download Certificate
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VirtualClassroom;
