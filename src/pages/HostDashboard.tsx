import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar as CalendarIcon, Users, Settings, Trash2, Edit2, Video, Star, Eye, BarChart3 } from "lucide-react";
import { useVirtualClassroom } from "@/hooks/useVirtualClassroom";

export default function HostDashboard() {
  const { user } = useAuth();
  const { editClassroom, cancelClassroom, addRecording } = useVirtualClassroom();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [payouts, setPayouts] = useState<any>(null);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [form, setForm] = useState<any>({ title: "", duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0, external_video_url: "" });
  
  // Bulk schedule state
  const [scheduleModalOpen, setScheduleModalOpen] = useState<string | null>(null);
  const [bulkConfig, setBulkConfig] = useState({ instances: 4, intervalDays: 7, startDate: new Date().toISOString().split('T')[0] });

  // Host Action Dialogs
  const [editDialog, setEditDialog] = useState<any>(null);
  const [conflictWarning, setConflictWarning] = useState<any>(null);
  const [pendingClassAction, setPendingClassAction] = useState<(() => Promise<void>) | null>(null);
  const [groupEnrollDialog, setGroupEnrollDialog] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [groupEmails, setGroupEmails] = useState("");
  const [bulkMessageDialog, setBulkMessageDialog] = useState<any>(null);
  const [bulkMessage, setBulkMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [recordingDialog, setRecordingDialog] = useState<any>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<any>(null);
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [verifyProof, setVerifyProof] = useState("");
  
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const handleReplyFeedback = async (participantId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${feedbackDialog._id}/feedback/${participantId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ response: replyText[participantId] })
      });
      if (!res.ok) throw new Error("Failed to reply");
      toast({ title: "Reply posted", description: "Your response has been published." });
      
      setFeedbacks(prev => prev.map(f => f._id === participantId ? { ...f, host_response: replyText[participantId] } : f));
      setReplyText(prev => ({ ...prev, [participantId]: "" }));
    } catch (e: any) {
      toast({ title: "Reply failed", description: e.message, variant: "destructive" });
    }
  };


  
  const handleVerifyHost = async () => {
    if (!verifyProof.trim()) {
      toast({ title: "Proof required", description: "Please provide a LinkedIn URL or portfolio link.", variant: "destructive" });
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/verify-host`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof: verifyProof })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Verification failed");
      }
      toast({ title: "Request Submitted", description: "Your verification request is now pending admin approval." });
      setVerifyDialog(false);
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    }
  };

  const fetchHostData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const [sessRes, tempRes, analyticsRes, payoutRes] = await Promise.all([
        fetch(`${API_URL}/api/classrooms/host`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/classrooms/templates`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/classrooms/host/analytics`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/classrooms/host/payouts`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (sessRes.ok) setSessions(await sessRes.json());
      if (tempRes.ok) setTemplates(await tempRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (payoutRes.ok) setPayouts(await payoutRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    if (!user) return;
    fetchHostData();
  }, [user]);

    const saveAsTemplate = async (classroomId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/save-template`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to save template');
      toast({ title: "Template saved successfully" });
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    }
  };

  
  const handleGroupEnroll = async () => {
    if (!groupName || !groupEmails) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const emails = groupEmails.split(',').map(e => e.trim()).filter(e => e);
      const res = await fetch(`${API_URL}/api/classrooms/${groupEnrollDialog._id}/group-enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, emails })
      });
      if (res.ok) {
        toast({ title: "Success", description: `Enrolled ${emails.length} members for ${groupName}` });
        setGroupEnrollDialog(null);
        setGroupName("");
        setGroupEmails("");
        loadClasses();
      } else {
        toast({ title: "Error", description: "Failed to enroll group", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Server error", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkMessage = async () => {
    if (!bulkMessage) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${bulkMessageDialog._id}/bulk-message`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: bulkMessage })
      });
      if (res.ok) {
        toast({ title: "Message Sent", description: "All participants have been notified." });
        setBulkMessageDialog(null);
        setBulkMessage("");
      } else {
        toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Server error", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const downloadRoster = (c: any) => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/api/classrooms/${c._id}/export-roster?token=${token}`, '_blank');
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      // Check conflict first
      const confRes = await fetch(`${API_URL}/api/classrooms/check-conflict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: form.scheduled_at, duration_minutes: form.duration_minutes, role: 'host' })
      });
      if (confRes.ok) {
        const confData = await confRes.json();
        if (confData.conflict) {
          setConflictWarning(`You are already hosting "${confData.conflicting_class}" at this time. Are you sure you want to schedule this?`);
          setPendingClassAction(() => async () => {
            await handleAction(() => create(form));
            setCreateDialog(false);
          });
          return;
        }
      }
      
      await handleAction(() => create(form));
      setCreateDialog(false);
    } catch (err) {}
  };
  const handleAction = async (action: () => Promise<void>) => {
    await action();
    fetchHostData();
  };

  const handleFetchFeedback = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${id}/feedback`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFeedbacks(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user) return toast.error("You must be logged in");
    if (!form.title) return toast.error("Cohort title is required");
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create template');
      }
      
      const data = await res.json();
      toast({ title: "Template saved!" });
      setTemplates([data, ...templates]);
      setOpenTemplate(false);
      setForm({ title: "", duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0, external_video_url: "" });
    } catch (error: any) {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkSchedule = async (templateId: string) => {
    if (!user) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Generate N instances
    const newSessions = [];
    const currentDate = new Date(bulkConfig.startDate);
    
    for (let i = 0; i < bulkConfig.instances; i++) {
      newSessions.push({
        title: `${template.title} (Session ${i + 1})`,
        subject: template.subject,
        description: template.description,
        duration_minutes: template.duration_minutes,
        max_participants: template.max_participants,
        visibility: template.visibility,
        type: template.type,
        is_paid: template.is_paid,
        price: template.price,
        scheduled_at: currentDate.toISOString()
      });
      // advance interval
      currentDate.setDate(currentDate.getDate() + bulkConfig.intervalDays);
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessions: newSessions })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to bulk schedule');
      }
      
      toast({ title: "Bulk scheduling complete!", description: `Created ${bulkConfig.instances} sessions.` });
      setScheduleModalOpen(null);
      // reload
      const sessRes = await fetch(`${API_URL}/api/classrooms/host`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (sessRes.ok) {
         setSessions(await sessRes.json());
      }
    } catch (error: any) {
      toast({ title: "Failed to bulk schedule", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-primary" aria-label="Loading dashboard..." />
      <span className="sr-only">Loading dashboard</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        
        <h1 className="text-3xl font-bold mb-6">Host Dashboard</h1>
        
        {user && !user.is_verified_host && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-4 rounded-lg mb-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">Host Verification Required</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                To maintain quality, hosts must be verified before creating classes and series.
              </p>
            </div>
            {user.host_verification_status === 'pending' ? (
              <span className="shrink-0 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-4 py-2 rounded-md font-medium text-sm">
                Verification Pending
              </span>
            ) : (
              <Dialog open={verifyDialog} onOpenChange={setVerifyDialog}>
                <DialogTrigger asChild>
                  <Button className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
                    Request Verification
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Host Verification Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Please provide a link to your LinkedIn profile or portfolio to verify your credentials.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="proof">Verification Proof</Label>
                      <Input
                        id="proof"
                        placeholder="https://linkedin.com/in/..."
                        value={verifyProof}
                        onChange={(e) => setVerifyProof(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setVerifyDialog(false)}>Cancel</Button>
                    <Button onClick={handleVerifyHost}>Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">All Sessions</TabsTrigger>
            <TabsTrigger value="templates">Templates & Bulk</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map(s => {
                const start = new Date(s.scheduled_at).getTime();
                const end = start + s.duration_minutes * 60000;
                const now = Date.now();
                const isLive = now >= start && now <= end;
                const isEnded = now > end;
                
                return (
                  <Card key={s.id} className={`flex flex-col ${s.status === 'cancelled' ? 'opacity-50' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold">{s.title}</h3>
                        {s.status === 'cancelled' ? (
                          <span className="bg-red-500/10 text-red-700 dark:text-red-400 text-xs px-2 py-1 rounded font-medium">Cancelled</span>
                        ) : isLive ? (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium animate-pulse">LIVE</span>
                        ) : isEnded ? (
                          <span className="bg-gray-500/10 text-gray-700 dark:text-gray-400 text-xs px-2 py-1 rounded font-medium">Ended</span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded font-medium">Upcoming</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarIcon className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" /> {s.participant_count} / {s.max_participants} Participants
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {s.status !== 'cancelled' && !isEnded && (
                          <Button size="sm" variant="outline" aria-label={`Edit ${s.title}`} className="focus:ring-2 focus:ring-primary" onClick={() => setEditDialog(s)}><Edit2 className="h-3 w-3 mr-1" aria-hidden="true"/> Edit</Button>
                        )}
                        {s.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" aria-label={`Recording for ${s.title}`} className="focus:ring-2 focus:ring-primary" onClick={() => setRecordingDialog(s)}><Video className="h-3 w-3 mr-1" aria-hidden="true"/> Recording</Button>
                        )}
                        {s.status !== 'cancelled' && isEnded && (
                          <Button size="sm" variant="outline" aria-label={`Ratings for ${s.title}`} className="focus:ring-2 focus:ring-primary" onClick={() => { setFeedbackDialog(s); handleFetchFeedback(s.id); }}><Star className="h-3 w-3 mr-1" aria-hidden="true"/> Ratings</Button>
                        )}
                        {s.status !== 'cancelled' && !isEnded && (
                          <Button size="sm" variant="outline" aria-label={`Cancel ${s.title}`} onClick={() => handleAction(() => cancelClassroom(s.id))} className="text-destructive hover:bg-destructive/10 focus:ring-2 focus:ring-destructive"><Trash2 className="h-3 w-3 mr-1" aria-hidden="true"/> Cancel</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {sessions.length === 0 && (
                <p className="text-muted-foreground">No sessions created yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Templates</h2>
              <Dialog open={openTemplate} onOpenChange={setOpenTemplate}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Template</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Session Template</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="title-pattern">Title Pattern</Label><Input id="title-pattern" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Weekly Math Prep" />
                    <Label htmlFor="duration-min">Duration (min)</Label><Input id="duration-min" type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: +e.target.value})} />
                  </div>
                  <DialogFooter><Button onClick={handleCreateTemplate}>Save Template</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <h3 className="font-bold">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.duration_minutes} min • {t.max_participants} max</p>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={scheduleModalOpen === t.id} onOpenChange={(o) => setScheduleModalOpen(o ? t.id : null)}>
                      <DialogTrigger asChild>
                        <Button className="w-full mt-2" variant="secondary"><CalendarIcon className="h-4 w-4 mr-2" /> Bulk Schedule</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Bulk Schedule: {t.title}</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-4">
                          <div>
                            <Label htmlFor="start-date-time-first-session">Start Date/Time (First Session)</Label><Input id="start-date-time-first-session" type="datetime-local" onChange={e => setBulkConfig({...bulkConfig, startDate: new Date(e.target.value).toISOString()})} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="number-of-sessions">Number of Sessions</Label><Input id="number-of-sessions" type="number" value={bulkConfig.instances} onChange={e => setBulkConfig({...bulkConfig, instances: +e.target.value})} />
                            </div>
                            <div>
                              <Label htmlFor="interval-days">Interval (Days)</Label><Input id="interval-days" type="number" value={bulkConfig.intervalDays} onChange={e => setBulkConfig({...bulkConfig, intervalDays: +e.target.value})} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            This will create {bulkConfig.instances} sessions, one every {bulkConfig.intervalDays} days starting on the selected date.
                          </p>
                        </div>
                        <DialogFooter><Button onClick={() => handleBulkSchedule(t.id)}>Generate Schedule</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
              {templates.length === 0 && <p className="text-muted-foreground">No templates saved.</p>}
            </div>
          </TabsContent>
                    <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Instructor Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p className="text-sm font-semibold text-primary mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold">${payouts?.totalEarnings || 0}</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900">
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">Pending Payouts</p>
                    <p className="text-3xl font-bold">${payouts?.pendingPayouts || 0}</p>
                  </div>
                </div>
                
                <h4 className="font-semibold mb-3">Earnings History</h4>
                {payouts?.history && payouts.history.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3">Class</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Participants</th>
                          <th className="p-3 text-right">Net Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.history.map((h: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-3 font-medium">{h.title}</td>
                            <td className="p-3 text-muted-foreground">{new Date(h.date).toLocaleDateString()}</td>
                            <td className="p-3">{h.participants}</td>
                            <td className="p-3 text-right text-green-600 font-bold">${h.earnings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No paid classes completed yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Sessions</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{analytics.totalSessions}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Attendees</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{analytics.totalAttendees}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Rating</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold flex items-center"><Star className="h-6 w-6 text-amber-500 fill-amber-500 mr-2" aria-hidden="true"/> {analytics.avgRating}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Earnings</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">${analytics.totalEarnings}</div></CardContent>
                  </Card>
                </div>
                
                <h3 className="text-xl font-bold mt-8 mb-4">Class-by-Class Analytics</h3>
                <div className="overflow-x-auto border rounded-md bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 border-b uppercase">
                      <tr>
                        <th className="px-4 py-3">Class Title</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-center">Total Joins</th>
                        <th className="px-4 py-3 text-center">Waitlist</th>
                        <th className="px-4 py-3 text-center">Attendance %</th>
                        <th className="px-4 py-3 text-center">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {analytics.classMetrics && analytics.classMetrics.map((cm: any) => (
                        <tr key={cm.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{cm.title}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(cm.scheduled_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-center">{cm.totalJoins} / {cm.capacity}</td>
                          <td className="px-4 py-3 text-center">{cm.waitlistSize > 0 ? <span className="text-amber-500 font-bold">{cm.waitlistSize}</span> : 0}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {cm.completionRate}%
                              <div className="w-16 h-2 bg-muted rounded overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${cm.completionRate}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium flex items-center justify-center">
                            {cm.averageRating > 0 ? (
                              <><Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" aria-hidden="true"/> {cm.averageRating.toFixed(1)}</>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!analytics.classMetrics || analytics.classMetrics.length === 0) && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No class analytics available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12"><Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" aria-label="Loading analytics..." /></div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Host Action Dialogs */}
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
              handleAction(() => editClassroom(editDialog.id, { title: editDialog.title, description: editDialog.description, duration_minutes: editDialog.duration_minutes }));
              setEditDialog(null);
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recordingDialog} onOpenChange={(o) => !o && setRecordingDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Session Recording</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Recording URL</Label>
            <Input 
              value={recordingDialog?.recording_url || ""} 
              onChange={e => setRecordingDialog({ ...recordingDialog, recording_url: e.target.value })} 
              placeholder="https://..." 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordingDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              handleAction(() => addRecording(recordingDialog.id, recordingDialog.recording_url));
              setRecordingDialog(null);
            }}>Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackDialog} onOpenChange={(o) => !o && setFeedbackDialog(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ratings & Feedback for {feedbackDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {feedbacks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No feedback submitted yet.</p>
            ) : (
              feedbacks.map((f, i) => (
                <div key={i} className="border rounded p-3 text-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{f.user_id?.name || 'Anonymous'}</span>
                    <span className="flex items-center text-amber-500"><Star className="h-3 w-3 fill-amber-500 mr-1"/> {f.rating}</span>
                  </div>
                  
                  {f.feedback && <p className="text-muted-foreground">{f.feedback}</p>}
                  
                  {f.host_response ? (
                    <div className="mt-2 pl-3 border-l-2 border-primary/50 text-xs">
                      <p className="font-semibold text-primary/80">Your Response:</p>
                      <p>{f.host_response}</p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <Textarea 
                        placeholder="Publicly reply to this feedback..." 
                        className="text-xs min-h-[60px]"
                        value={replyText[f._id] || ""}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [f._id]: e.target.value }))}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleReplyFeedback(f._id)}>Post Reply</Button>
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
