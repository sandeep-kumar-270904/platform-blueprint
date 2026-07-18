import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Briefcase, GraduationCap, ShieldCheck, Trophy, Star } from "lucide-react";

interface TimelineEvent {
  type: 'experience' | 'education' | 'certification' | 'quiz_achievement' | 'mentorship';
  title: string;
  date: string;
  endDate?: string;
  description: string;
}

interface AchievementTimelineProps {
  portfolioSlug: string;
}

export const AchievementTimeline: React.FC<AchievementTimelineProps> = ({ portfolioSlug }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/portfolios/public/${portfolioSlug}/timeline`);
        if (res.ok) {
          setEvents(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [portfolioSlug]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (events.length === 0) return null;

  const getIcon = (type: string) => {
    switch(type) {
      case 'experience': return <Briefcase className="h-5 w-5 text-blue-500" />;
      case 'education': return <GraduationCap className="h-5 w-5 text-purple-500" />;
      case 'certification': return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'quiz_achievement': return <Trophy className="h-5 w-5 text-amber-500" />;
      default: return <Star className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="mt-8 border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Achievement Timeline</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="relative border-l border-muted-foreground/20 ml-3 space-y-8 pb-4">
          {events.map((event, i) => (
            <div key={i} className="relative pl-8">
              <div className="absolute -left-[18px] top-1 bg-background border rounded-full p-1 shadow-sm">
                {getIcon(event.type)}
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <time className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  {event.endDate ? ` - ${new Date(event.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}` : ''}
                </time>
              </div>
              {event.description && (
                <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
