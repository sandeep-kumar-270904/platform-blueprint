import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, MessageSquare, Lightbulb, BookOpen, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ActivityItem {
  activity_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}

export const LiveActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/live-activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActivities(await res.json());
      } else {
        setActivities([]);
      }
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-green-500 animate-pulse" />
            My Recent Activity
          </div>
          <Badge className="bg-red-500/10 text-red-500 border-none">LIVE</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors">
                {item.activity_type === "note" && <BookOpen className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />}
                {item.activity_type === "idea" && <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />}
                {item.activity_type === "classroom_message" && <MessageSquare className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {item.activity_type === "note" && "Uploaded note"}
                    {item.activity_type === "idea" && "Posted idea"}
                    {item.activity_type === "classroom_message" && "Classroom message"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
