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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Users, Trophy, Clock, Search, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useNavigate } from "react-router-dom";

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { events, myRegistrations, loading, status, createEvent } = useEvents(selectedType, timeFilter, searchQuery);
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ 
    eventType: "workshop", 
    isVirtual: false,
    registrationRequired: true
  });
  const [submitted, setSubmitted] = useState(false);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const typeColor = (t: string) => ({ hackathon: "accent", competition: "warning", workshop: "success", seminar: "secondary" } as any)[t] || "default";

  const handleCreate = async () => {
    if (!form.title || !form.startDate || !form.endDate || !form.startTime || !form.endTime || (!form.isVirtual && !form.venue)) return;
    
    await createEvent({
      ...form,
      venue: form.isVirtual ? (form.venue || "Virtual") : form.venue,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
      prizes: form.prizes ? form.prizes.split(",").map((p: string) => p.trim()) : [],
      hostName: form.hostName || user?.full_name || user?.username || "Community Member"
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        
        {/* Header Controls */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full md:w-auto">
            <TabsList className="w-full md:w-auto overflow-x-auto flex flex-nowrap justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="hackathon">Hackathons</TabsTrigger>
              <TabsTrigger value="competition">Competitions</TabsTrigger>
              <TabsTrigger value="workshop">Workshops</TabsTrigger>
              <TabsTrigger value="seminar">Seminars</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Tabs value={timeFilter} onValueChange={setTimeFilter}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {user ? (
              <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setSubmitted(false); }}>
                <DialogTrigger asChild>
                  <Button className="shrink-0"><Plus className="h-4 w-4 mr-1" /> Host Event</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                  {submitted ? (
                    <div className="py-12 text-center flex flex-col items-center">
                      <CheckCircle2 className="h-16 w-16 text-success mb-4" />
                      <h3 className="text-xl font-bold mb-2">Event Submitted!</h3>
                      <p className="text-muted-foreground max-w-md">
                        Your event has been submitted and is pending admin approval. You'll be notified once it's reviewed.
                      </p>
                      <Button className="mt-6" onClick={() => setOpen(false)}>Close</Button>
                    </div>
                  ) : (
                    <>
                      <DialogHeader><DialogTitle>Host an Event</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>Title</Label>
                          <Input value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea rows={3} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Event Type</Label>
                            <Select value={form.eventType} onValueChange={v => setForm({ ...form, eventType: v })}>
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
                            <Label>Host Organization / Name</Label>
                            <Input value={form.hostName || ""} onChange={e => setForm({ ...form, hostName: e.target.value })} placeholder="e.g. Computer Science Club" required />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 py-2">
                          <Checkbox 
                            id="virtual" 
                            checked={form.isVirtual} 
                            onCheckedChange={(c) => setForm({ ...form, isVirtual: !!c })} 
                          />
                          <Label htmlFor="virtual" className="font-normal cursor-pointer">This is a virtual event</Label>
                        </div>
                        
                        <div>
                          <Label>{form.isVirtual ? "Meeting Link / Platform" : "Venue Location"}</Label>
                          <Input 
                            value={form.venue || ""} 
                            onChange={e => setForm({ ...form, venue: e.target.value })} 
                            placeholder={form.isVirtual ? "e.g. Zoom link or 'Discord'" : "e.g. Room 304, Building A"} 
                            required 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start Date</Label>
                            <Input type="date" onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <Input type="date" onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                          </div>
                          <div>
                            <Label>Start Time</Label>
                            <Input type="time" onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <Input type="time" onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                          <Checkbox 
                            id="regReq" 
                            checked={form.registrationRequired} 
                            onCheckedChange={(c) => setForm({ ...form, registrationRequired: !!c })} 
                          />
                          <Label htmlFor="regReq" className="font-normal cursor-pointer">Requires Registration</Label>
                        </div>

                        {form.registrationRequired && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Capacity (Leave empty for unlimited)</Label>
                              <Input type="number" value={form.capacity || ""} onChange={e => setForm({ ...form, capacity: e.target.value ? +e.target.value : null })} />
                            </div>
                            <div>
                              <Label>Registration Deadline</Label>
                              <Input type="date" onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
                            </div>
                          </div>
                        )}

                        {/* Conditional Fields based on Event Type */}
                        {(form.eventType === "hackathon" || form.eventType === "competition") && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label>Min Team Size</Label><Input type="number" defaultValue={1} onChange={e => setForm({ ...form, teamSize: { ...form.teamSize, min: +e.target.value }})} /></div>
                              <div><Label>Max Team Size</Label><Input type="number" defaultValue={4} onChange={e => setForm({ ...form, teamSize: { ...form.teamSize, max: +e.target.value }})} /></div>
                            </div>
                            <div>
                              <Label>Prizes (Comma separated)</Label>
                              <Input value={form.prizes || ""} onChange={e => setForm({ ...form, prizes: e.target.value })} placeholder="e.g. $1000, MacBook, Swag" />
                            </div>
                          </>
                        )}

                        <div>
                          <Label>Tags (comma separated)</Label>
                          <Input value={form.tags || ""} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. AI, Web Dev, Beginner" />
                        </div>
                        <div>
                          <Label>Banner Image URL (Optional)</Label>
                          <Input value={form.bannerImage || ""} onChange={e => setForm({ ...form, bannerImage: e.target.value })} placeholder="https://..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Submit for Approval</Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            ) : (
              <Button onClick={() => navigate("/auth")}>Login to Host</Button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted"></div>
                <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
            {(searchQuery || selectedType !== 'all' || timeFilter !== 'upcoming') && (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedType("all"); setTimeFilter("upcoming"); }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                registered={myRegistrations.has(event.id!)} 
                fmtDate={fmtDate} 
                typeColor={typeColor}
                onClick={() => navigate(`/events/${event.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EventCard = ({ event, registered, fmtDate, typeColor, onClick }: any) => {
  const isFull = event.capacity && event.registrationCount >= event.capacity;
  const isPast = new Date(event.startDate) < new Date();
  
  return (
    <Card className="card-hover overflow-hidden flex flex-col cursor-pointer" onClick={onClick}>
      {event.bannerImage ? (
        <div className="h-40 w-full overflow-hidden">
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`h-40 w-full flex items-center justify-center bg-${typeColor(event.eventType)}/10`}>
          <Calendar className={`h-12 w-12 text-${typeColor(event.eventType)}`} />
        </div>
      )}
      <CardHeader className="pb-3 flex-grow">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Badge variant={typeColor(event.eventType)} className="capitalize">{event.eventType}</Badge>
          <Badge variant="outline">{event.isVirtual ? "Virtual" : "In-Person"}</Badge>
          {event.prizes && event.prizes.length > 0 && <Badge variant="success"><Trophy className="mr-1 h-3 w-3" />Prizes</Badge>}
        </div>
        <h3 className="font-semibold line-clamp-2 text-lg">{event.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Hosted by {event.hostName}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm mt-auto">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {fmtDate(event.startDate)} at {event.startTime}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{event.venue}</span>
        </div>
        {event.registrationRequired && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {event.capacity ? `${event.registrationCount || 0}/${event.capacity} registered` : "Unlimited spots"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Events;
