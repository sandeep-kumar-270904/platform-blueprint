import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, Trophy, Clock, Search, Plus, Loader2, LayoutList, CalendarDays, ExternalLink, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { useEvents, EventRow } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CalendarView } from "@/components/events/CalendarView";
import { format } from "date-fns";
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
      if (key !== 'page') prev.delete('page'); 
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
  
  const { events, thisWeekEvents, myRegistrations, myBookmarks, pagination, toggleBookmark, loading } = useEvents(
    selectedType, 
    viewMode === "list" ? timeFilter : "all", 
    searchQuery,
    viewMode === "calendar" ? format(currentMonth, 'yyyy-MM') : "",
    page
  );

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  const typeColorClass = (t: string) => {
    return t === 'hackathon' ? 'bg-blue-600 text-white' :
           t === 'competition' ? 'bg-orange-600 text-white' :
           t === 'workshop' ? 'bg-purple-600 text-white' :
           'bg-green-600 text-white';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* PREMIUM DISCOVERY HERO */}
      <div className="relative pt-24 pb-16 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent" />
        <div className="container relative z-10 mx-auto px-4 text-center max-w-3xl">
          <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur-sm border-primary/20 text-primary">
            <Compass className="w-3 h-3 mr-2" /> Explore the ecosystem
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Tech Events</span> & Hackathons
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find the best campus events, global tech summits, and virtual hackathons to accelerate your career.
          </p>
          
          <div className="relative max-w-xl mx-auto shadow-lg rounded-2xl overflow-hidden bg-background p-2 flex items-center border border-muted-foreground/10">
            <Search className="h-5 w-5 text-muted-foreground ml-3 mr-2 shrink-0" />
            <Input 
              placeholder="Search by keyword, tag, or technology..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 text-md h-12"
            />
            {user ? (
              <Button onClick={() => navigate('/events/create')} className="shrink-0 h-12 px-6 rounded-xl shadow-md transition-transform active:scale-95">
                <Plus className="h-4 w-4 mr-2" /> Host
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} className="shrink-0 h-12 px-6 rounded-xl">Login to Host</Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* FILTER CONTROLS */}
        <div className="mb-10 flex flex-col lg:flex-row items-center justify-between gap-6 border-b pb-6">
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full lg:w-auto">
            <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-6">All Events</TabsTrigger>
              <TabsTrigger value="hackathon" className="rounded-lg px-6">Hackathons</TabsTrigger>
              <TabsTrigger value="competition" className="rounded-lg px-6">Competitions</TabsTrigger>
              <TabsTrigger value="workshop" className="rounded-lg px-6">Workshops</TabsTrigger>
              <TabsTrigger value="seminar" className="rounded-lg px-6">Seminars</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {viewMode === 'list' && (
              <Tabs value={timeFilter} onValueChange={setTimeFilter}>
                <TabsList className="bg-muted/50 rounded-xl p-1">
                  <TabsTrigger value="upcoming" className="rounded-lg px-6">Upcoming</TabsTrigger>
                  <TabsTrigger value="past" className="rounded-lg px-6">Past</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            <div className="flex border rounded-xl p-1 bg-muted/50">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`h-9 px-4 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4 mr-2" /> List
              </Button>
              <Button 
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`h-9 px-4 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4 mr-2" /> Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* THIS WEEK HIGHLIGHT STRIP */}
        {(() => {
          const showThisWeek = viewMode === 'list' && thisWeekEvents.length > 0 && timeFilter === 'upcoming' && !searchQuery;
          const filteredGridEvents = showThisWeek 
            ? events.filter(e => !thisWeekEvents.some(twe => twe.id === e.id)) 
            : events;
            
          return (
            <>
              {showThisWeek && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary"><Clock className="h-5 w-5" /></div> 
                      Happening This Week
                    </h3>
                  </div>
                  <div className="flex overflow-x-auto gap-6 pb-6 snap-x pt-2 -mx-4 px-4 md:mx-0 md:px-0">
                    {thisWeekEvents.map(event => (
                      <div key={event.id} className="min-w-[320px] w-[320px] snap-start">
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

              {/* CONTENT */}
              {loading ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="animate-pulse border-muted/60 shadow-sm rounded-2xl overflow-hidden">
                      <div className="h-48 bg-muted"></div>
                      <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                      <CardContent className="space-y-3 pb-6">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center border-2 rounded-2xl border-dashed bg-muted/10">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No events found</h3>
                  <p className="text-muted-foreground text-lg mb-8 max-w-md">We couldn't find any events matching your current filters. Try adjusting your search query.</p>
                  {(searchQuery || selectedType !== 'all' || timeFilter !== 'upcoming') && (
                    <Button size="lg" variant="outline" onClick={() => { setLocalSearch(""); setSelectedType("all"); setTimeFilter("upcoming"); }}>
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                viewMode === 'list' ? (
                  <>
                    {filteredGridEvents.length > 0 && showThisWeek && (
                      <h3 className="text-2xl font-bold mb-6 mt-12 flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg text-accent"><CalendarDays className="h-5 w-5" /></div>
                        All Upcoming Events
                      </h3>
                    )}
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                    
                    {/* PAGINATION CONTROLS */}
                    {pagination.pages > 1 && (
                      <div className="flex justify-center items-center mt-12 gap-6">
                        <Button 
                          variant="outline" 
                          size="lg"
                          disabled={pagination.page <= 1} 
                          onClick={() => setPage(pagination.page - 1)}
                          className="rounded-xl"
                        >
                          <ChevronLeft className="h-5 w-5 mr-2" /> Previous
                        </Button>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Page <span className="text-foreground">{pagination.page}</span> of <span className="text-foreground">{pagination.pages}</span>
                        </span>
                        <Button 
                          variant="outline" 
                          size="lg"
                          disabled={pagination.page >= pagination.pages} 
                          onClick={() => setPage(pagination.page + 1)}
                          className="rounded-xl"
                        >
                          Next <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-card rounded-2xl shadow-sm border border-muted overflow-hidden">
                    <CalendarView 
                      currentMonth={currentMonth} 
                      setCurrentMonth={setCurrentMonth} 
                      events={events}
                      navigate={navigate}
                      typeColorClass={typeColorClass}
                    />
                  </div>
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
