import { useState, useEffect } from "react";
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
import { Calendar, MapPin, Users, Trophy, Clock, Search, Plus, Loader2, CheckCircle2, LayoutList, CalendarDays, ExternalLink, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEvents, EventRow } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EventCard } from "@/components/events/EventCard";

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { events, thisWeekEvents, myRegistrations, loading, status, createEvent } = useEvents(
    selectedType, 
    viewMode === "list" ? timeFilter : "all", 
    searchQuery,
    viewMode === "calendar" ? format(currentMonth, 'yyyy-MM') : ""
  );

  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/colleges?limit=1000`)
      .then(res => res.json())
      .then(data => setColleges(data.colleges || []))
      .catch(err => console.error(err));
  }, []);
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ 
    eventType: "workshop", 
    isVirtual: false,
    registrationRequired: true
  });
  const [submitted, setSubmitted] = useState(false);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  const typeColorClass = (t: string) => {
    return t === 'hackathon' ? 'bg-blue-600 text-white' :
           t === 'competition' ? 'bg-orange-600 text-white' :
           t === 'workshop' ? 'bg-purple-600 text-white' :
           'bg-green-600 text-white';
  };

  const handleCreate = async () => {
    if (!form.title || !form.startDate || !form.endDate || !form.startTime || !form.endTime || (!form.isVirtual && !form.venue)) return;
    
    await createEvent({
      ...form,
      venue: form.isVirtual ? (form.venue || "Virtual") : form.venue,
      hostCollegeId: form.hostCollegeId || null,
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
            <div className="flex border rounded-md p-1 bg-muted/50">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4 mr-2" /> List
              </Button>
              <Button 
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4 mr-2" /> Calendar
              </Button>
            </div>
            {viewMode === 'list' && (
              <Tabs value={timeFilter} onValueChange={setTimeFilter}>
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
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
                        
                        <div>
                          <Label>Hosted by College (Optional)</Label>
                          <Select value={form.hostCollegeId || "none"} onValueChange={v => setForm({ ...form, hostCollegeId: v === "none" ? null : v })}>
                            <SelectTrigger><SelectValue placeholder="Select a college..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No specific college</SelectItem>
                              {colleges.map(c => (
                                <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

        {/* This Week Highlight Strip */}
        {viewMode === 'list' && thisWeekEvents.length > 0 && timeFilter === 'upcoming' && !searchQuery && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Happening This Week</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {thisWeekEvents.map(event => (
                <div key={event.id} className="min-w-[300px] w-[300px] snap-start">
                  <EventCard 
                    event={event} 
                    registered={myRegistrations.has(event.id!)} 
                    fmtDate={fmtDate} 
                    typeColorClass={typeColorClass}
                    onClick={() => navigate(`/events/${event.id}`)}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
          viewMode === 'list' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  registered={myRegistrations.has(event.id!)} 
                  fmtDate={fmtDate} 
                  typeColorClass={typeColorClass}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <CalendarView 
              currentMonth={currentMonth} 
              setCurrentMonth={setCurrentMonth} 
              events={events}
              navigate={navigate}
              typeColorClass={typeColorClass}
            />
          )
        )}
      </div>
    </div>
  );
};

const CalendarView = ({ currentMonth, setCurrentMonth, events, navigate, typeColorClass }: any) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(d => (
          <div key={d} className="p-3 text-center text-sm font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = events.filter((e: any) => isSameDay(new Date(e.startDate), day));
          const isCurrMonth = isSameMonth(day, monthStart);
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] p-2 border-r border-b ${!isCurrMonth ? 'bg-muted/10 text-muted-foreground' : ''} ${isToday(day) ? 'bg-primary/5' : ''}`}
            >
              <div className={`text-right text-sm mb-1 ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                {format(day, dateFormat)}
              </div>
              <div className="space-y-1">
                {dayEvents.length > 0 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer space-y-1">
                        {dayEvents.slice(0, 3).map((e: any) => (
                          <div key={e.id} className={`text-xs p-1 px-2 rounded truncate ${typeColorClass(e.eventType)}`} title={e.title}>
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center font-medium">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3 font-semibold border-b flex justify-between items-center">
                        {format(day, "MMMM do, yyyy")}
                        <Badge variant="secondary">{dayEvents.length} Events</Badge>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {dayEvents.map((e: any) => (
                          <div key={e.id} className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/events/${e.id}`)}>
                            <div className="flex gap-2 items-center mb-1">
                              <div className={`w-2 h-2 rounded-full ${typeColorClass(e.eventType).split(' ')[0]}`} />
                              <span className="font-medium text-sm line-clamp-1">{e.title}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-between pl-4">
                              <span>{e.startTime}</span>
                              <span className="capitalize">{e.eventType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="h-full w-full"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Events;
