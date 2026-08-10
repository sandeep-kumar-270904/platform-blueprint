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
import { CalendarView } from "@/components/events/CalendarView";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EventCard } from "@/components/events/EventCard";
import { useSearchParams } from "react-router-dom";

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = searchParams.get("type") || "all";
  const timeFilter = searchParams.get("time") || "upcoming";
  const searchQuery = searchParams.get("search") || "";
  const viewMode = (searchParams.get("view") as "list" | "calendar") || "list";
  const page = parseInt(searchParams.get("page") || "1");

  const updateParam = (key: string, value: string, defaultValue: string) => {
    setSearchParams(prev => {
      if (value === defaultValue || !value) prev.delete(key);
      else prev.set(key, value);
      if (key !== 'page') prev.delete('page'); // reset page on filter change
      return prev;
    }, { replace: true });
  };

  const setSelectedType = (v: string) => updateParam("type", v, "all");
  const setTimeFilter = (v: string) => updateParam("time", v, "upcoming");
  const setViewMode = (v: "list" | "calendar") => updateParam("view", v, "list");
  const setPage = (p: number) => updateParam("page", p.toString(), "1");

  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateParam("search", localSearch, "");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { events, thisWeekEvents, myRegistrations, myBookmarks, pagination, toggleBookmark, loading, status, createEvent } = useEvents(
    selectedType, 
    viewMode === "list" ? timeFilter : "all", 
    searchQuery,
    viewMode === "calendar" ? format(currentMonth, 'yyyy-MM') : "",
    page
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
    if (!form.title) return toast.error("Event title is required");
    if (!form.startDate) return toast.error("Start date is required");
    if (!form.endDate) return toast.error("End date is required");
    if (!form.startTime) return toast.error("Start time is required");
    if (!form.endTime) return toast.error("End time is required");
    if (!form.isVirtual && !form.venue) return toast.error("Venue is required for in-person events");
    await createEvent({
      ...form,
      venue: form.isVirtual ? (form.venue || "Virtual") : form.venue,
      hostCollegeId: form.hostCollegeId || null,
      tags: form.tags ? (typeof form.tags === 'string' ? form.tags.split(",").map((t: string) => t.trim()) : form.tags) : [],
      prizes: form.prizes ? (typeof form.prizes === 'string' ? form.prizes.split(",").map((p: string) => p.trim()) : form.prizes) : [],
      agenda: form.agenda ? [{ time: 'TBD', title: 'Agenda', description: form.agenda }] : [],
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
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {user ? (
              <Button className="shrink-0" onClick={() => navigate('/events/create')}>
                <Plus className="h-4 w-4 mr-1" /> Host Event
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")}>Login to Host</Button>
            )}
          </div>
        </div>

        {/* This Week Highlight Strip */}
        {(() => {
          const showThisWeek = viewMode === 'list' && thisWeekEvents.length > 0 && timeFilter === 'upcoming' && !searchQuery;
          const filteredGridEvents = showThisWeek 
            ? events.filter(e => !thisWeekEvents.some(twe => twe.id === e.id)) 
            : events;
            
          return (
            <>
              {showThisWeek && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Happening This Week</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {thisWeekEvents.map(event => (
                <div key={event.id} className="min-w-[300px] w-[300px] snap-start">
                  <EventCard 
                    event={event} 
                    registered={myRegistrations.has(event.id!)} 
                    bookmarked={myBookmarks.has(event.id!)}
                    toggleBookmark={toggleBookmark}
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
            <>
              {filteredGridEvents.length > 0 && showThisWeek && (
                <h3 className="text-lg font-semibold mb-4 mt-8">All Upcoming Events</h3>
              )}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredGridEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  registered={myRegistrations.has(event.id!)} 
                  bookmarked={myBookmarks.has(event.id!)}
                  toggleBookmark={toggleBookmark}
                  fmtDate={fmtDate} 
                  typeColorClass={typeColorClass}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-4">
                <Button 
                  variant="outline" 
                  disabled={pagination.page <= 1} 
                  onClick={() => setPage(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground">Page {pagination.page} of {pagination.pages}</span>
                <Button 
                  variant="outline" 
                  disabled={pagination.page >= pagination.pages} 
                  onClick={() => setPage(pagination.page + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
            </>
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
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Events;
