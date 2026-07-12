import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, MapPin, Users, Trophy, Star } from "lucide-react";

export const EventCard = ({ event, registered, fmtDate, typeColorClass, onClick, compact = false }: any) => {
  const isFull = event.capacity && event.registrationCount >= event.capacity;
  const isPast = new Date(event.startDate) < new Date();
  
  return (
    <Card className="card-hover overflow-hidden flex flex-col cursor-pointer" onClick={onClick}>
      {event.bannerImage ? (
        <div className={`${compact ? 'h-32' : 'h-40'} w-full overflow-hidden`}>
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`${compact ? 'h-32' : 'h-40'} w-full flex items-center justify-center bg-muted`}>
          <Calendar className={`h-12 w-12 text-muted-foreground opacity-20`} />
        </div>
      )}
      <CardHeader className="pb-3 flex-grow">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Badge variant={event.eventType as any} className="capitalize">{event.eventType}</Badge>
          <Badge variant="outline">{event.isVirtual ? "Virtual" : "In-Person"}</Badge>
          {event.prizes && event.prizes.length > 0 && <Badge variant="success"><Trophy className="mr-1 h-3 w-3" />Prizes</Badge>}
        </div>
        <h3 className={`font-semibold line-clamp-2 ${compact ? 'text-md' : 'text-lg'}`}>{event.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Hosted by {event.hostName}</p>
        
        {event.hostCollegeId && event.hostCollegeId.name && (
          <div className="mt-2 inline-flex items-center text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => { e.stopPropagation(); /* TODO: Navigate to college */ }}
          >
            🏫 {event.hostCollegeId.name}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm mt-auto">
        {event.avgRating > 0 && (
          <div className="flex items-center gap-1 text-warning mb-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{event.avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">({event.totalFeedbackCount})</span>
          </div>
        )}
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
