import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users, Heart, Sparkles, Code, Trophy, Presentation, Target, CalendarRange, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookmarkButton = ({ eventId, bookmarked, toggleBookmark }: any) => {
  if (!toggleBookmark) return null;
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={`h-8 w-8 rounded-full bg-background/95 hover:bg-background shadow-sm transition-all duration-300 ${bookmarked ? 'text-rose-500' : 'text-muted-foreground'}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(eventId);
      }}
    >
      <Heart className={`h-4 w-4 transition-transform ${bookmarked ? 'fill-current scale-110' : ''}`} />
    </Button>
  );
};

const isValidDate = (d: any) => {
  if (!d) return false;
  const date = new Date(d);
  return date.getTime() > 0 && date.getFullYear() > 1971;
};

const formatEventType = (type: string) => {
  if (!type) return "Event";
  if (type === 'community_content') return 'Community';
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getCategoryVisuals = (type: string) => {
  switch (type) {
    case 'hackathon':
    case 'coding_contest':
      return { Icon: Code, colorClass: 'from-blue-500/20 to-blue-600/10 text-blue-500' };
    case 'competition':
      return { Icon: Trophy, colorClass: 'from-orange-500/20 to-orange-600/10 text-orange-500' };
    case 'workshop':
    case 'seminar':
    case 'webinar':
    case 'conference':
      return { Icon: Presentation, colorClass: 'from-purple-500/20 to-purple-600/10 text-purple-500' };
    case 'career_event':
      return { Icon: Target, colorClass: 'from-emerald-500/20 to-emerald-600/10 text-emerald-500' };
    default:
      return { Icon: CalendarRange, colorClass: 'from-muted-foreground/10 to-muted text-muted-foreground' };
  }
};

export const EventCard = ({ event, registered, bookmarked, toggleBookmark, fmtDate, onClick }: any) => {
  const isFull = event.capacity && event.registrationCount >= event.capacity;
  const isPast = isValidDate(event.startDate) && new Date(event.startDate) < new Date();
  
  const { Icon: FallbackIcon, colorClass } = getCategoryVisuals(event.eventType);

  return (
    <Card 
      className="group relative flex flex-col cursor-pointer border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-card hover:border-primary/30 overflow-hidden" 
      onClick={onClick}
    >
      {/* IMAGE SECTION */}
      <div className="h-[160px] w-full relative overflow-hidden bg-muted">
        {event.bannerImage ? (
          <img 
            src={event.bannerImage} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colorClass}`}>
            <FallbackIcon className="h-10 w-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
        
        {/* Gradients & Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <div className="absolute top-3 right-3 z-10">
          <BookmarkButton eventId={event.id} bookmarked={bookmarked} toggleBookmark={toggleBookmark} />
        </div>
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {event.isVirtual && (
            <Badge variant="secondary" className="bg-background/95 hover:bg-background/95 text-[10px] font-semibold text-foreground border-none px-2 shadow-sm">
              Virtual
            </Badge>
          )}
          {event.prizes && event.prizes.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500/90 hover:bg-amber-500/90 text-white border-none text-[10px] font-bold shadow-sm">
              <Trophy className="h-3 w-3 mr-1" /> Prizes
            </Badge>
          )}
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex flex-col flex-grow p-5 pb-4">
        {/* Category & Status */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {formatEventType(event.eventType)}
          </span>
          {event.source && event.source.provider !== 'INTERNAL' && (
            <span className="text-[10px] text-muted-foreground uppercase font-medium bg-muted px-1.5 py-0.5 rounded">
              External
            </span>
          )}
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        {/* Host */}
        <p className="text-xs text-muted-foreground font-medium truncate mb-4">
          By {event.hostName || "Unknown Host"}
        </p>

        {/* Metadata Grid */}
        <div className="mt-auto space-y-2.5">
          {/* Date & Time */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">
              {isValidDate(event.startDate) ? (
                <span className="font-medium text-foreground">{fmtDate(event.startDate)}</span>
              ) : (
                <span>Date TBA</span>
              )}
              {event.startTime && <span> • {event.startTime}</span>}
            </span>
          </div>
          
          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">
              {event.isVirtual ? "Virtual Event" : event.venue ? event.venue : "Location TBA"}
            </span>
          </div>

          {/* Registration */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/50">
            <div className="flex items-center text-xs text-muted-foreground">
              {event.registrationRequired ? (
                <>
                  <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
                  {event.capacity ? (
                    <span className={isFull ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                      {event.registrationCount || 0} / {event.capacity} registered
                    </span>
                  ) : (
                    <span className="text-foreground font-medium">Registration Open</span>
                  )}
                </>
              ) : (
                <span className="opacity-0">No Reg</span> /* spacer to keep alignment */
              )}
            </div>
            
            <span className={`text-xs font-semibold transition-transform group-hover:translate-x-0.5 ${isPast ? 'text-muted-foreground' : 'text-primary'}`}>
              {registered ? "Registered" : isPast ? "View Details" : "View"} &rarr;
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
