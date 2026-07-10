import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Handshake, ArrowRight } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface Collaboration {
  team_id: string;
  role: string;
  team_name: string;
  idea_title: string | null;
  idea_category: string | null;
}

const roleColors: Record<string, string> = {
  founder: "bg-primary/10 text-primary",
  co_founder: "bg-accent/10 text-accent-foreground",
  developer: "bg-blue-500/10 text-blue-600",
  designer: "bg-pink-500/10 text-pink-600",
  marketer: "bg-green-500/10 text-green-600",
  analyst: "bg-orange-500/10 text-orange-600",
  researcher: "bg-purple-500/10 text-purple-600",
  user: "bg-muted text-muted-foreground",
};

export const MyCollaborations = ({ userId }: { userId: string }) => {
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamIds, setTeamIds] = useState<string[]>([]);

  const fetchCollabs = useCallback(async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/my-collaborations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCollabs(data);
        setTeamIds(data.map((c: any) => c.team_id));
      } else {
        setCollabs([]);
        setTeamIds([]);
      }
    } catch {
      setCollabs([]);
      setTeamIds([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useRealtimeSync({
    channelName: `my-collabs-${userId}`,
    filters: [],
    onChange: fetchCollabs,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="h-5 w-5 text-primary" />
          My Collaborations ({collabs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : collabs.length === 0 ? (
          <div className="text-center py-8">
            <Handshake className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Not collaborating on any ideas yet</p>
            <Link to="/team-hunt">
              <Button variant="outline" size="sm" className="gap-1">
                Find Teams <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {collabs.map((c) => (
              <div
                key={c.team_id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate">{c.team_name}</h4>
                  {c.idea_title && (
                    <p className="text-xs text-muted-foreground truncate">
                      Working on: {c.idea_title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.idea_category && <Badge variant="outline" className="text-[10px]">{c.idea_category}</Badge>}
                  <Badge className={`text-[10px] ${roleColors[c.role] || roleColors.user}`}>
                    {c.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
