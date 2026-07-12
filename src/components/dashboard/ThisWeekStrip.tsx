import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Building2, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { formatDistanceToNow } from "date-fns";

export const ThisWeekStrip = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThisWeek = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const [eventsRes, collegesRes] = await Promise.all([
          fetch(`${API_URL}/api/users/me/events/registered`, { headers }),
          fetch(`${API_URL}/api/colleges/saved/me`, { headers })
        ]);

        const weekItems: any[] = [];
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const upcoming = eventsData.upcoming || [];
          upcoming.forEach((ev: any) => {
            const evDate = new Date(ev.startDate);
            if (evDate >= now && evDate <= nextWeek) {
              weekItems.push({
                type: 'event',
                id: ev._id,
                title: ev.title,
                date: evDate,
                time: ev.startTime,
                badge: ev.eventType,
                link: `/events/${ev._id}`
              });
            }
          });
        }

        if (collegesRes.ok) {
          const collegesData = await collegesRes.json();
          // Mock some time-sensitive info for saved colleges, like admission deadlines
          // If we had real deadlines, we'd filter them here. For now, we'll just pick one if it has a deadline soon.
          collegesData.forEach((col: any) => {
            if (col.admissionDeadline) {
              const dlDate = new Date(col.admissionDeadline);
              if (dlDate >= now && dlDate <= nextWeek) {
                 weekItems.push({
                   type: 'college_deadline',
                   id: col._id,
                   title: `${col.name} Admission Deadline`,
                   date: dlDate,
                   badge: 'deadline',
                   link: `/colleges/${col._id}`
                 });
              }
            }
          });
        }

        // Sort by date soonest
        weekItems.sort((a, b) => a.date.getTime() - b.date.getTime());
        setItems(weekItems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchThisWeek();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">This Week</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {items.map((item, i) => (
          <ScrollReveal key={`${item.type}-${item.id}`} delay={i * 0.1} direction="left" className="shrink-0 w-72">
            <Link to={item.link}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full border-l-4 border-l-primary">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="capitalize text-[10px] py-0">{item.badge}</Badge>
                      <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                        {formatDistanceToNow(item.date, { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    {item.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {item.time}</span>}
                    <span className="flex items-center gap-1 text-primary font-medium ml-auto">View <ArrowRight className="h-3 w-3"/></span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};
