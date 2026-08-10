import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Users, Settings, BarChart3, Download, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
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

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/events')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">Host Dashboard</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => window.open(`/events/${id}`, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" /> View Public Page
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="attendees" className="gap-2"><Users className="w-4 h-4" /> Attendees ({attendees.length})</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{event.registrationCount || 0}</div>
                  <p className="text-muted-foreground text-sm">Total Registrations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{event.capacity || 'Unlimited'}</div>
                  <p className="text-muted-foreground text-sm">Capacity Limit</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{event.avgRating > 0 ? event.avgRating.toFixed(1) : 'No Ratings'}</div>
                  <p className="text-muted-foreground text-sm">Average Rating</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="attendees">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attendees List</CardTitle>
                  <CardDescription>Manage and view registered attendees.</CardDescription>
                </div>
                <Button variant="outline" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((a: any) => (
                        <tr key={a._id} className="bg-background border-b last:border-0 hover:bg-muted/20">
                          <td className="px-6 py-4 font-medium">{a.userId?.full_name || 'N/A'}</td>
                          <td className="px-6 py-4">{a.userId?.email || 'N/A'}</td>
                          <td className="px-6 py-4 capitalize">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.status === 'waitlisted' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{new Date(a.registeredAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {attendees.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No attendees registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Update your event details or delete the event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <Label>Venue / Link</Label>
                    <Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Capacity (Empty for unlimited)</Label>
                    <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4 border-t">
                  <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete Event</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the event and remove all registrations.
                        All registered attendees will be notified.
                      </p>
                      <DialogFooter>
                        <Button variant="destructive" onClick={handleDelete}>Yes, delete event</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
