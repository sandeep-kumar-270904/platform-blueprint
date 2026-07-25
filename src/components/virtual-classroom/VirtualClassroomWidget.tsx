import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, ArrowRight, Activity, Clock, PlayCircle, ShieldAlert, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";


export function VirtualClassroomWidget() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/classrooms/dashboard-sync`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Failed to load widget data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchWidgetData();
  }, [user]);

  if (loading || !data) return null;

  const { liveClasses = [], upcomingClasses = [], waitlisted = [], recentRecordings = [], hostActions = 0, stats = {} } = data;

  if (liveClasses.length === 0 && upcomingClasses.length === 0 && waitlisted.length === 0 && recentRecordings.length === 0 && hostActions === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-lg">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Virtual Classroom Sync
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground hidden sm:flex">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {stats.attended || 0} Attended</span>
          <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {stats.badges || 0} Badges</span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* LIVE NOW */}
        {liveClasses.length > 0 && (
          <div className="space-y-3 col-span-1 md:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Now
            </h4>
            {liveClasses.map((c: any) => (
              <div key={c._id} className="bg-background rounded-lg p-3 flex flex-col gap-2 shadow-sm border border-red-500/30">
                <div>
                  <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.role === 'host' ? 'Hosting' : 'Attending'}</p>
                </div>
                <Button size="sm" variant="destructive" className="w-full" asChild>
                  <Link to={`/classroom/${c._id}`}>Join Live</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* UPCOMING */}
        {upcomingClasses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming</h4>
            {upcomingClasses.map((c: any) => (
              <div key={c._id} className="bg-background rounded-lg p-3 flex items-center justify-between shadow-sm border">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/classroom/${c._id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* HOST ACTIONS & WAITLIST */}
        {(hostActions > 0 || waitlisted.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Updates</h4>
            
            {hostActions > 0 && (
              <div className="bg-background rounded-lg p-3 flex items-center justify-between shadow-sm border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Pending Join Requests</span>
                </div>
                <Badge variant="destructive">{hostActions}</Badge>
              </div>
            )}

            {waitlisted.map((c: any) => (
              <div key={c._id} className="bg-background rounded-lg p-3 flex items-center justify-between shadow-sm border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                    <p className="text-xs text-muted-foreground">Waitlist Position: {c.waitlistPos}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/classroom/${c._id}`}>Check</Link>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* RECORDINGS */}
        {recentRecordings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Recordings</h4>
            {recentRecordings.map((c: any) => (
              <div key={c._id} className="bg-background rounded-lg p-3 flex items-center justify-between shadow-sm border">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/classroom/${c._id}/recap`}>Watch</Link>
                </Button>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
