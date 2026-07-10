import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, ThumbsUp, Users, ArrowRight, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string | null;
  upvotes: number | null;
  tags: string[] | null;
  created_at: string;
  team_id: string | null;
}

const statusMap: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  idea: { label: "Idea", className: "bg-primary/10 text-primary" },
  mvp: { label: "MVP", className: "bg-green-500/10 text-green-600" },
  launched: { label: "Launched", className: "bg-accent/10 text-accent-foreground" },
};

export const MyIdeas = ({ userId }: { userId: string }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/my-ideas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
        setTeamCounts(data.teamCounts || {});
      } else {
        setIdeas([]);
        setTeamCounts({});
      }
    } catch {
      setIdeas([]);
      setTeamCounts({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useRealtimeSync({
    channelName: `my-ideas-${userId}`,
    filters: [],
    onChange: fetchIdeas,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          My Ideas ({ideas.length})
        </CardTitle>
        <Link to="/innovation-hub">
          <Button size="sm" className="gap-1">
            <Plus className="h-3 w-3" /> New Idea
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 mb-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-12" /></div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No ideas yet. Start innovating!</p>
            <Link to="/innovation-hub">
              <Button variant="outline" size="sm" className="gap-1">
                Post Your First Idea <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => {
              const status = statusMap[idea.status || "draft"] || statusMap.draft;
              return (
                <div
                  key={idea.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm truncate">{idea.title}</h4>
                      <Badge className={`text-[10px] ${status.className}`}>{status.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{idea.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{idea.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {idea.upvotes || 0}
                      </span>
                      {idea.team_id && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {teamCounts[idea.team_id] || 0} members
                        </span>
                      )}
                      <span>{formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
