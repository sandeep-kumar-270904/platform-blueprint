import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, MapPin, Users, Trophy, Star, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookmarkButton = ({ eventId, bookmarked, toggleBookmark }: any) => {
  if (!toggleBookmark) return null;
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={`h-9 w-9 rounded-full bg-background/90 hover:bg-background hover:scale-105 backdrop-blur-md shadow-sm transition-all duration-300 ${bookmarked ? 'text-rose-500' : 'text-muted-foreground'}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(eventId);
      }}
    >
      <Heart className={`h-4 w-4 transition-transform ${bookmarked ? 'fill-current scale-110' : ''}`} />
    </Button>
  );
};

export const EventCard = ({ event, registered, bookmarked, toggleBookmark, fmtDate, typeColorClass, onClick, compact = false }: any) => {
  const isFull = event.capacity && event.registrationCount >= event.capacity;
  const isPast = new Date(event.startDate) < new Date();
  
  return (
    <Card 
      className="group relative overflow-hidden flex flex-col cursor-pointer border-muted/60 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-card hover:-translate-y-1" 
      onClick={onClick}
    >
      {/* IMAGE SECTION */}
      {event.bannerImage ? (
        <div className={`${compact ? 'h-36' : 'h-48'} w-full overflow-hidden relative`}>
          <img 
            src={event.bannerImage} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <BookmarkButton eventId={event.id} bookmarked={bookmarked} toggleBookmark={toggleBookmark} />
          </div>
          
          {/* BADGES ON IMAGE */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-10">
             {event.source && event.source.provider !== 'INTERNAL' && (
              <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-md border-none font-semibold">
                <ExternalLink className="mr-1 h-3 w-3" /> {(event.isExternalContent || event.eventType === 'community_content') ? 'Community' : 'External'}
              </Badge>
            )}
             <Badge variant={event.eventType as any} className="capitalize shadow-sm font-semibold">{event.eventType}</Badge>
          </div>
        </div>
      ) : (
        <div className={`${compact ? 'h-36' : 'h-48'} w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden`}>
          <Calendar className={`h-16 w-16 text-muted-foreground opacity-20 group-hover:scale-110 transition-transform duration-500`} />
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <BookmarkButton eventId={event.id} bookmarked={bookmarked} toggleBookmark={toggleBookmark} />
          </div>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-10">
             {event.source && event.source.provider !== 'INTERNAL' && (
              <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-md border-none font-semibold">
                <ExternalLink className="mr-1 h-3 w-3" /> {(event.isExternalContent || event.eventType === 'community_content') ? 'Community' : 'External'}
              </Badge>
            )}
             <Badge variant={event.eventType as any} className="capitalize shadow-sm font-semibold">{event.eventType}</Badge>
          </div>
        </div>
      )}

      {/* CONTENT SECTION */}
      <CardHeader className={`pb-3 flex-grow ${compact ? 'pt-4' : 'pt-5'}`}>
        <div className="mb-2 flex items-center justify-between">
           <Badge variant="outline" className="text-xs bg-muted/30 border-muted-foreground/20 text-muted-foreground font-medium">
             {event.isVirtual ? "Virtual Event" : "In-Person Event"}
           </Badge>
           {event.prizes && event.prizes.length > 0 && (
             <span className="text-xs font-semibold flex items-center text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
               <Trophy className="mr-1 h-3 w-3" /> Prizes
             </span>
           )}
        </div>
        
        <h3 className={`font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors ${compact ? 'text-lg' : 'text-xl'}`}>
          {event.title}
        </h3>
        
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <span className="truncate">By {event.hostName}</span>
        </div>
        
        {event.hostCollegeId && event.hostCollegeId.name && (
          <div className="mt-2 inline-flex items-center text-xs font-medium bg-secondary/50 px-2.5 py-1 rounded-md text-secondary-foreground hover:bg-secondary transition-colors"
            onClick={(e) => { e.stopPropagation(); /* Navigate to college */ }}
          >
            🏫 {event.hostCollegeId.name}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-5 pt-0 mt-auto border-t border-border/50 pt-4">
        {event.avgRating > 0 && (
          <div className="flex items-center gap-1.5 text-warning mb-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-bold text-foreground">{event.avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground font-medium text-xs">({event.totalFeedbackCount} reviews)</span>
          </div>
        )}
        
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          {fmtDate(event.startDate)} <span className="text-muted-foreground">•</span> {event.startTime}
        </div>
        
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="truncate font-medium">{event.venue}</span>
        </div>
        
        {event.registrationRequired && (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground mt-2">
            <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
            <span className="font-medium">
              {event.capacity ? (
                <>
                  <span className={isFull ? 'text-destructive' : 'text-foreground'}>
                    {event.registrationCount || 0}
                  </span>
                  /{event.capacity} registered
                </>
              ) : (
                "Unlimited spots"
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
