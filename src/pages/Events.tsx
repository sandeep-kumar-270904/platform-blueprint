import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Trophy, Clock, Sparkles, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { AttendanceManager } from "@/components/events/AttendanceManager";

const Events = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("all");
  const { events, myRegistrations, loading, status, register, cancel, createEvent } = useEvents(selectedType);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: "workshop", mode: "online", capacity: 100 });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const daysLeft = (d: string | null) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff;
  };
  const typeColor = (t: string) => ({ hackathon: "accent", competition: "warning", workshop: "success", seminar: "secondary" } as any)[t] || "default";

  const handleCreate = async () => {
    if (!form.title || !form.starts_at) return;
    await createEvent({
      ...form,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
    });
    setOpen(false);
    setForm({ type: "workshop", mode: "online", capacity: 100 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="hackathon">Hackathons</TabsTrigger>
              <TabsTrigger value="competition">Competitions</TabsTrigger>
              <TabsTrigger value="workshop">Workshops</TabsTrigger>
              <TabsTrigger value="seminar">Seminars</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator status={status} />
            {user && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Host Event</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Host an Event</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Title</Label><Input value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hackathon">Hackathon</SelectItem>
                            <SelectItem value="competition">Competition</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="seminar">Seminar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Mode</Label>
                        <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Venue</Label><Input value={form.venue || ""} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Starts</Label><Input type="datetime-local" onChange={e => setForm({ ...form, starts_at: new Date(e.target.value).toISOString() })} /></div>
                      <div><Label>Deadline</Label><Input type="datetime-local" onChange={e => setForm({ ...form, registration_deadline: new Date(e.target.value).toISOString() })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} /></div>
                      <div><Label>Prize</Label><Input value={form.prize || ""} onChange={e => setForm({ ...form, prize: e.target.value })} /></div>
                    </div>
                    <div><Label>Tags (comma separated)</Label><Input value={form.tags || ""} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">No events yet</h3>
            <p className="text-muted-foreground">Be the first to host one!</p>
          </div>
        ) : (
          <>
            {events.some(e => e.featured) && (
              <div className="mb-12">
                <h2 className="mb-6 text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-accent" />Featured</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {events.filter(e => e.featured).map(event => (
                    <EventCard key={event.id} event={event} registered={myRegistrations.has(event.id)} isOrganizer={event.organizer_id === user?.id} onRegister={() => register(event.id)} onCancel={() => cancel(event.id)} fmtDate={fmtDate} daysLeft={daysLeft} typeColor={typeColor} featured />
                  ))}
                </div>
              </div>
            )}
            <h2 className="mb-6 text-2xl font-bold">All Events</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.filter(e => !e.featured).map(event => (
                <EventCard key={event.id} event={event} registered={myRegistrations.has(event.id)} isOrganizer={event.organizer_id === user?.id} onRegister={() => register(event.id)} onCancel={() => cancel(event.id)} fmtDate={fmtDate} daysLeft={daysLeft} typeColor={typeColor} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const EventCard = ({ event, registered, isOrganizer, onRegister, onCancel, fmtDate, daysLeft, typeColor, featured = false }: any) => {
  const left = daysLeft(event.registration_deadline);
  const full = event.registration_count >= event.capacity;
  return (
    <Card className={`card-hover overflow-hidden ${featured ? "border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Badge variant={typeColor(event.type)}>{event.type}</Badge>
          <Badge variant="outline">{event.mode}</Badge>
          {event.prize && <Badge variant="success"><Trophy className="mr-1 h-3 w-3" />{event.prize}</Badge>}
        </div>
        <h3 className={featured ? "text-xl font-bold" : "font-semibold line-clamp-2"}>{event.title}</h3>
        <p className={`mt-1 text-sm text-muted-foreground ${featured ? "" : "line-clamp-2"}`}>{event.description}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{fmtDate(event.starts_at)}</div>
        {left !== null && left >= 0 && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-warning" />{left} days left to register</div>}
        {event.venue && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span className="truncate">{event.venue}</span></div>}
        <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{event.registration_count}/{event.capacity}</div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {registered ? (
          <Button variant="outline" className="w-full" onClick={onCancel}><CheckCircle2 className="h-4 w-4 mr-2 text-success" />Registered · Cancel</Button>
        ) : (
          <Button variant={featured ? "hero" : "default"} className="w-full" disabled={full} onClick={onRegister}>
            {full ? "Full" : "Register"}
          </Button>
        )}
        {(registered || isOrganizer) && (
          <AttendanceManager
            eventId={event.id}
            eventTitle={event.title}
            isOrganizer={isOrganizer}
            isRegistered={registered}
            trigger={<Button variant="ghost" size="sm" className="w-full">📋 Attendance{isOrganizer ? " & Report" : ""}</Button>}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default Events;
