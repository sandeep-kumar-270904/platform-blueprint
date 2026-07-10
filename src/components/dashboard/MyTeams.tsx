import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ArrowRight, Crown } from "lucide-react";

interface TeamWithMembers {
  id: string;
  name: string;
  description: string | null;
  myRole: string;
  members: { user_id: string; role: string; username: string | null }[];
}

export const MyTeams = ({ userId }: { userId: string }) => {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/my-teams`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        } else {
          setTeams([]);
        }
      } catch {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [userId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          My Teams ({teams.length})
        </CardTitle>
        <Link to="/team-hunt">
          <Button variant="outline" size="sm" className="gap-1">
            Find Teams <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">You haven't joined any teams yet</p>
            <Link to="/team-hunt">
              <Button variant="outline" size="sm" className="gap-1">
                Explore Teams <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{team.name}</h4>
                    {team.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{team.description}</p>
                    )}
                  </div>
                  <Badge className="text-[10px] bg-primary/10 text-primary">
                    {team.myRole === "founder" && <Crown className="h-2.5 w-2.5 mr-1" />}
                    {team.myRole.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {team.members.slice(0, 5).map((m) => (
                    <Avatar key={m.user_id} className="h-7 w-7 border-2 border-background -ml-1 first:ml-0">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {(m.username || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 5 && (
                    <span className="text-xs text-muted-foreground ml-1">+{team.members.length - 5}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
