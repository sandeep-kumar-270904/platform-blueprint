import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";

export const UpcomingSessions = ({ userId }: { userId: string }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      // Fetch blocks
      const { data: blocks } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", userId);
      const blockedIds = blocks?.map(b => b.blocked_id) || [];

      // 1. Fetch user's attending/hosting sessions
      const { data: participation } = await supabase
        .from("virtual_classroom_participants")
        .select("classroom_id")
        .eq("user_id", userId);
        
      const joinedIds = participation?.map((p: any) => p.classroom_id) || [];

      let upcomingQuery = supabase
        .from("virtual_classrooms")
        .select("*")
        .or(`id.in.(${joinedIds.join(',') || '00000000-0000-0000-0000-000000000000'}),host_id.eq.${userId}`)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3);
        
      if (blockedIds.length > 0) {
        upcomingQuery = upcomingQuery.not("host_id", "in", `(${blockedIds.join(',')})`);
      }

      const { data: upcoming } = await upcomingQuery;
      if (upcoming) setSessions(upcoming);

      // 2. Fetch AI Recommendations (sessions not joined, matching past subjects)
      // Extract subjects of past attended classes
      const { data: pastClasses } = await supabase
        .from("virtual_classrooms")
        .select("subject")
        .in("id", joinedIds)
        .not("subject", "is", null);
        
      const subjects = [...new Set(pastClasses?.map(c => c.subject))];

      let recsQuery = supabase
        .from("virtual_classrooms")
        .select("*")
        .gte("scheduled_at", new Date().toISOString())
        .not("host_id", "eq", userId)
        .not("id", "in", `(${joinedIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .order("scheduled_at", { ascending: true })
        .limit(2);
        
      if (blockedIds.length > 0) {
        recsQuery = recsQuery.not("host_id", "in", `(${blockedIds.join(',')})`);
      }
        
      // If user has past subjects, filter by them to simulate "Smart Personalized AI Recommendation"
      if (subjects.length > 0) {
        recsQuery = recsQuery.in("subject", subjects);
      }
      
      const { data: recs } = await recsQuery;
      if (recs) setRecommendations(recs);
    };

    fetchSessions();
  }, [userId]);

  if (sessions.length === 0 && recommendations.length === 0) return null;

  return (
    <Card className="flex flex-col h-full border-primary/20 bg-gradient-to-br from-card to-primary/5">
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

      </CardContent>
    </Card>
  );
};
