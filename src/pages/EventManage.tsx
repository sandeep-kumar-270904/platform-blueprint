import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Users, Settings, BarChart3, Download, Trash2, ArrowLeft, ExternalLink, CalendarDays, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function EventManage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<any>({});
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [eventRes, attendeesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events/${id}`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events/${id}/attendees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (eventRes.ok) {
          const data = await eventRes.json();
          setEvent(data);
          setForm({
            title: data.title,
            description: data.description,
            eventType: data.eventType,
            isVirtual: data.isVirtual,
            venue: data.venue,
            startDate: data.startDate?.substring(0,10),
            endDate: data.endDate?.substring(0,10),
            startTime: data.startTime,
            endTime: data.endTime,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            registrationRequired: data.registrationRequired,
            capacity: data.capacity || "",
            tags: data.tags ? data.tags.join(", ") : "",
            bannerImage: data.bannerImage || ""
          });
        }
        if (attendeesRes.ok) {
          setAttendees(await attendeesRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background pt-24 text-center">Loading dashboard...</div>;
  if (!event) return <div className="min-h-screen bg-background pt-24 text-center">Event not found.</div>;

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        capacity: form.capacity ? Number(form.capacity) : null
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to update event');
      toast.success("Event updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete event');
      toast.success("Event deleted");
      navigate('/events');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const downloadCSV = () => {
    const headers = ["Name,Email,Status,Registered At"];
    const rows = attendees.map(a => `${a.userId?.full_name || 'N/A'},${a.userId?.email || 'N/A'},${a.status},${new Date(a.registeredAt).toLocaleString()}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeAttendees = attendees.filter(a => a.status === 'registered').length;
  const waitlistedAttendees = attendees.filter(a => a.status === 'waitlisted').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Premium Dashboard Header */}
      <div className="bg-muted pt-24 pb-12 border-b">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-muted-foreground hover:text-foreground" onClick={() => navigate('/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={event.status === 'approved' ? 'default' : 'secondary'} className="uppercase">
                  {event.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  {event.lifecycleStatus}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm font-medium">
                <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1.5" /> {format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {event.venue || 'Virtual'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button onClick={() => window.open(`/events/${id}`, '_blank')} className="w-full md:w-auto rounded-xl shadow-md">
                <ExternalLink className="w-4 h-4 mr-2" /> View Public Page
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 bg-muted/50 p-1.5 rounded-xl border border-muted flex flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-2 rounded-lg py-2.5 px-6"><BarChart3 className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="attendees" className="gap-2 rounded-lg py-2.5 px-6"><Users className="w-4 h-4" /> Attendees ({attendees.length})</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 rounded-lg py-2.5 px-6"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="rounded-2xl border-muted-foreground/10 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-sm font-medium">Total Registered</p>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="w-4 h-4" /></div>
                  </div>
                  <div className="text-3xl font-bold">{activeAttendees}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-muted-foreground/10 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-sm font-medium">Waitlisted</p>
                    <div className="p-2 bg-warning/10 rounded-lg text-warning"><Clock className="w-4 h-4" /></div>
                  </div>
                  <div className="text-3xl font-bold">{waitlistedAttendees}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-muted-foreground/10 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-sm font-medium">Capacity</p>
                    <div className="p-2 bg-muted rounded-lg text-muted-foreground"><BarChart3 className="w-4 h-4" /></div>
                  </div>
                  <div className="text-3xl font-bold">{event.capacity || '∞'}</div>
                  {event.capacity && (
                    <div className="w-full bg-secondary h-1.5 mt-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${Math.min((activeAttendees / event.capacity) * 100, 100)}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-muted-foreground/10 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-sm font-medium">Avg Rating</p>
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600"><Star className="w-4 h-4" /></div>
                  </div>
                  <div className="text-3xl font-bold">{event.avgRating > 0 ? event.avgRating.toFixed(1) : '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Based on {event.totalFeedbackCount} reviews</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Additional dashboard widgets can go here */}
            <Card className="rounded-2xl border-muted-foreground/10 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest registrations and updates for your event.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-8">
                  Activity feed will be populated as users interact with your event.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendees">
            <Card className="rounded-2xl shadow-sm border-muted-foreground/10">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Attendees Management</CardTitle>
                  <CardDescription>View and export the list of registered attendees.</CardDescription>
                </div>
                <Button variant="outline" onClick={downloadCSV} className="rounded-xl"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Attendee</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Registration Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendees.map((a: any) => (
                        <tr key={a._id} className="bg-card hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{a.userId?.full_name || 'N/A'}</div>
                            <div className="text-muted-foreground text-xs">{a.userId?.email || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.status === 'waitlisted' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                              {a.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">
                            {format(new Date(a.registeredAt), 'MMM d, yyyy h:mm a')}
                          </td>
                        </tr>
                      ))}
                      {attendees.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                            No attendees have registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-2xl shadow-sm border-muted-foreground/10">
                  <CardHeader>
                    <CardTitle>Basic Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Event Title</Label>
                      <Input className="rounded-xl" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea className="rounded-xl min-h-[150px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-muted-foreground/10">
                  <CardHeader>
                    <CardTitle>Logistics & Timing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input className="rounded-xl" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input className="rounded-xl" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input className="rounded-xl" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input className="rounded-xl" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Input className="rounded-xl" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacity (Empty for unlimited)</Label>
                        <Input className="rounded-xl" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4">
                      <Label>Venue / Location</Label>
                      <Input className="rounded-xl" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-2xl shadow-sm border-muted-foreground/10 bg-muted/20">
                  <CardHeader>
                    <CardTitle>Publish Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                      Note: Changing dates, times, or locations may require re-approval from admins and will notify all registered attendees.
                    </p>
                    <Button onClick={handleUpdate} disabled={saving} className="w-full rounded-xl h-12 text-md font-semibold shadow-md">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-destructive/20 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                      Deleting this event will permanently remove all associated data, including registrations and feedback. This action is irreversible.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full rounded-xl h-11"><Trash2 className="w-4 h-4 mr-2" /> Delete Event</Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Delete Event</DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground">
                          Are you absolutely sure you want to delete <span className="font-bold text-foreground">{event.title}</span>? 
                          All attendees will be notified of the cancellation.
                        </p>
                        <DialogFooter className="mt-6">
                          <Button variant="destructive" onClick={handleDelete} className="rounded-xl px-6">Yes, delete permanently</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
