import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";

export const UpcomingSessions = ({ userId }: { userId: string }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/upcoming-sessions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
          setRecommendations(data.recommendations || []);
        } else {
          setSessions([]);
          setRecommendations([]);
        }
      } catch {
        setSessions([]);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userId]);

  if (sessions.length === 0 && recommendations.length === 0) return null;

  return (
    <Card className="flex flex-col h-full border-primary/20 bg-primary text-primary-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Session Hub
          </div>
          <Link to="/virtual-classroom">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex justify-between border-b border-border/50 pb-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 ml-2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {sessions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Upcoming For You</h4>
            {sessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between border-b border-primary/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <h4 className="font-medium text-sm line-clamp-1">{s.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <Badge variant={s.host_id === userId ? "default" : "outline"} className="ml-2 whitespace-nowrap text-[10px]">
                  {s.host_id === userId ? "Hosting" : "Attending"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-primary/10">
            <h4 className="text-xs font-semibold uppercase text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Recommended by AI
            </h4>
            {recommendations.map((s) => (
              <Link to="/virtual-classroom" key={s.id} className="block group">
                <div className="flex items-start justify-between p-2 -mx-2 rounded-md hover:bg-primary/10 transition-colors">
                  <div>
                    <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{s.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.subject || "General"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
