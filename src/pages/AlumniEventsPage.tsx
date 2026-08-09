import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, MapPin, Users, Video, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniEventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      toast.error('Failed to load alumni events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alumni Events</h1>
            <p className="text-muted-foreground mt-1">Workshops, AMAs, and networking sessions hosted by alumni.</p>
          </div>
          <Button variant="outline" onClick={() => toast.info('To host an event, visit the Events dashboard.')}>
            Host an Event
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No upcoming events</h3>
            <p className="text-muted-foreground mt-1">Check back later for new events hosted by alumni.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <Card key={event._id} className="hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {event.bannerImage && (
                  <div className="h-40 w-full overflow-hidden bg-gray-100">
                    <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="capitalize text-xs font-semibold bg-primary/10 text-primary">
                      {event.eventType}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-xl leading-tight text-gray-900 mb-2">{event.title}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(event.startDate)}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-1">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 border">
                        <AvatarImage src={event.hostedBy?.avatar_url} />
                        <AvatarFallback>{(event.hostedBy?.full_name || 'A').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground leading-tight">Hosted by</span>
                        <span className="text-sm font-medium text-gray-900 leading-tight">
                          {event.hostedBy?.full_name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {event.isVirtual ? (
                        <div className="flex items-center text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          <Video className="w-3 h-3 mr-1" /> Virtual
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          <MapPin className="w-3 h-3 mr-1" /> In-person
                        </div>
                      )}
                      <Button size="sm" onClick={() => toast.info('Event registration coming soon!')}>
                        Register
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
