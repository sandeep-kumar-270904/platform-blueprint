import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Clock, Search, Plus, LayoutList, CalendarDays, Filter, ChevronDown, Check
} from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarView } from "@/components/events/CalendarView";
import { format } from "date-fns";
import { EventCard } from "@/components/events/EventCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CATEGORIES = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'competition', label: 'Competitions' },
  { id: 'coding_contest', label: 'Coding Contests' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'seminar', label: 'Seminars' },
  { id: 'conference', label: 'Conferences' },
  { id: 'webinar', label: 'Webinars' },
  { id: 'career_event', label: 'Career Events' },
  { id: 'tech_event', label: 'Tech Events' },
  { id: 'other', label: 'Other' }
];

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = searchParams.get("type") || "all";
  const timeFilter = searchParams.get("time") || "upcoming";
  const searchQuery = searchParams.get("search") || "";
  const viewMode = (searchParams.get("view") as "list" | "calendar") || "list";
  const page = parseInt(searchParams.get("page") || "1");
  const modeFilter = searchParams.get("mode") || "all"; // all, online, in_person
  const sortOrder = searchParams.get("sort") || "upcoming"; // upcoming, newest, deadline

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
  const setModeFilter = (v: string) => updateParam("mode", v, "all");
  const setSortOrder = (v: string) => updateParam("sort", v, "upcoming");

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateParam("search", localSearch, "");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const { events, thisWeekEvents, myRegistrations, myBookmarks, toggleBookmark, loading } = useEvents(
    selectedType, 
    viewMode === "list" ? timeFilter : "all", 
    searchQuery,
    viewMode === "calendar" ? format(currentMonth, 'yyyy-MM') : "",
    page,
    modeFilter,
    sortOrder
  );

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  const typeColorClass = (t: string) => {
    if (['hackathon', 'coding_contest'].includes(t)) return 'bg-blue-600 text-white';
    if (['competition'].includes(t)) return 'bg-orange-600 text-white';
    if (['workshop', 'seminar', 'webinar'].includes(t)) return 'bg-purple-600 text-white';
    if (['career_event'].includes(t)) return 'bg-emerald-600 text-white';
    return 'bg-green-600 text-white';
  };

  const getSortLabel = () => {
    if (sortOrder === 'newest') return 'Recently Added';
    if (sortOrder === 'deadline') return 'Closing Soon';
    return 'Upcoming First';
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Category</h3>
        <div className="flex flex-col space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                selectedType === cat.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.label}
              {selectedType === cat.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Event Mode</h3>
        <div className="flex flex-col space-y-1">
          {[
            { id: 'all', label: 'Any Mode' },
            { id: 'online', label: 'Online / Virtual' },
            { id: 'in_person', label: 'In-Person' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setModeFilter(mode.id)}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                modeFilter === mode.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {mode.label}
              {modeFilter === mode.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Timeframe</h3>
        <div className="flex flex-col space-y-1">
          {[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past Events' }
          ].map((time) => (
            <button
              key={time.id}
              onClick={() => setTimeFilter(time.id)}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                timeFilter === time.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {time.label}
              {timeFilter === time.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* COMMAND BAR */}
      <div className="pt-28 pb-6 bg-background relative z-10 border-b">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="w-full md:max-w-xl relative flex items-center bg-muted/20 hover:bg-muted/40 rounded-xl border border-border/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm">
              <Search className="h-5 w-5 text-muted-foreground ml-4 shrink-0" />
              <Input 
                placeholder="Search opportunities, organizers, tech..." 
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="border-none shadow-none focus-visible:ring-0 bg-transparent h-12 w-full text-base placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50 shrink-0">
                <button 
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="h-4 w-4" /> List
                </button>
                <button 
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarDays className="h-4 w-4" /> Calendar
                </button>
              </div>

              {user && (
                <>
                  <div className="h-6 w-px bg-border/60 mx-1 hidden md:block" />
                  <Button onClick={() => navigate('/events/create')} className="shrink-0 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-10 px-5">
                    <Plus className="h-4 w-4 mr-2" /> Host Event
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* DESKTOP SIDEBAR FILTER */}
          <aside className="hidden lg:block w-[240px] shrink-0 sticky top-28 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pb-8 border-r pr-6">
            <FilterPanel />
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0 w-full">
            
            {/* MOBILE FILTER & SORT BAR */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              
              {/* Mobile Filter Drawer */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 font-semibold bg-muted/30">
                      <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <FilterPanel />
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Title (Only shows on LG+) */}
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold tracking-tight">
                  {CATEGORIES.find(c => c.id === selectedType)?.label || "Opportunities"}
                </h2>
              </div>

              {/* SORT DROPDOWN */}
              {viewMode === 'list' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground h-9 px-3">
                      Sort: <span className="text-foreground ml-1 font-medium">{getSortLabel()}</span>
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSortOrder('upcoming')} className="justify-between">
                      Upcoming First {sortOrder === 'upcoming' && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('newest')} className="justify-between">
                      Recently Added {sortOrder === 'newest' && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('deadline')} className="justify-between">
                      Closing Soon {sortOrder === 'deadline' && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* HAPPENING THIS WEEK STRIP */}
            {(() => {
              const showThisWeek = viewMode === 'list' && thisWeekEvents.length > 0 && timeFilter === 'upcoming' && !searchQuery && selectedType === 'all';
              const filteredGridEvents = showThisWeek 
                ? events.filter(e => !thisWeekEvents.some(twe => twe.id === e.id)) 
                : events;
                
              return (
                <>
                  {showThisWeek && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" /> 
                          Happening This Week
                        </h3>
                      </div>
                      <div className="flex overflow-x-auto gap-6 pb-4 snap-x pt-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {thisWeekEvents.map(event => (
                          <div key={event.id} className="min-w-[340px] w-[340px] snap-start">
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
                      <div className="h-px bg-border/40 w-full mt-6" />
                    </div>
                  )}

                  {/* MAIN GRID OR CALENDAR */}
                  {viewMode === "calendar" ? (
                     <div className="bg-card border rounded-xl overflow-hidden shadow-sm animate-in fade-in">
                       <CalendarView 
                         events={events} 
                         currentMonth={currentMonth} 
                         onMonthChange={setCurrentMonth} 
                       />
                     </div>
                  ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[340px] bg-muted/40 animate-pulse rounded-xl border" />
                      ))}
                    </div>
                  ) : filteredGridEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
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
                          compact={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl mt-4">
                      <h3 className="text-xl font-bold mb-2">No opportunities found</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        We couldn't find any events matching your current filters. Try adjusting your search or removing some filters.
                      </p>
                      <Button onClick={() => navigate('/events')} variant="outline">
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}

          </main>
        </div>
      </div>
    </div>
  );
}
