import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Upload, Star, TrendingUp, Loader2 } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { formatStat } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Contributor {
  user_id: string;
  username: string | null;
  full_name: string | null;
  note_count: number;
  avg_rating: number;
  total_views: number;
  total_downloads: number;
  rank?: number;
}

const RANK_STYLES = [
  { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", icon: "🥇" },
  { bg: "bg-slate-400/10", border: "border-slate-400/30", text: "text-slate-500", icon: "🥈" },
  { bg: "bg-orange-600/10", border: "border-orange-600/30", text: "text-orange-600", icon: "🥉" },
];

export const TopContributors = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [currentUserData, setCurrentUserData] = useState<Contributor | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadContributors();
  }, [refreshTrigger]);

  const loadContributors = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/notes/top-contributors`, { headers });
      if (res.ok) {
        const data = await res.json();
        setContributors(data.top10 || []);
        setCurrentUserData(data.currentUser || null);
      }
    } catch {}
    setLoading(false);
  };

  const getDisplayName = (c: Contributor) => c.full_name || c.username || "Anonymous";
  const getInitials = (c: Contributor) => getDisplayName(c).slice(0, 2).toUpperCase();

  return (
    <Card className="bg-card border-border shadow-sm rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Trophy className="h-4 w-4 text-primary" aria-hidden="true" /> Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : contributors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributors yet.</p>
        ) : (
          <div className="space-y-2">
            {contributors.map((c, i) => {
              const rankStyle = i < 3 ? RANK_STYLES[i] : null;

              return (
                <ScrollReveal key={c.user_id} delay={i * 0.04} direction="left">
                  <div
                    className={`flex items-center gap-3 rounded-lg p-2 transition-all hover:shadow-sm ${
                      rankStyle ? `${rankStyle.bg} border ${rankStyle.border}` : "hover:bg-muted/50 border border-transparent"
                    } ${c.user_id === user?.id ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    {/* Rank */}
                    <div className="w-6 text-center shrink-0">
                      {rankStyle ? (
                        <span className="text-base">{rankStyle.icon}</span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                          #{i + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={`text-xs ${rankStyle ? `${rankStyle.bg} ${rankStyle.text}` : "bg-muted text-foreground border border-border"}`}>
                        {getInitials(c)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {getDisplayName(c)} {c.user_id === user?.id && <span className="text-xs text-primary font-normal">(You)</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Upload className="h-3 w-3" aria-hidden="true" />{formatStat(c.note_count, true)}
                        </span>
                        {c.avg_rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />{formatStat(c.avg_rating, true, "", true)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
            
            {/* Current User Rank if outside top 10 */}
            {currentUserData && (!contributors.some(c => c.user_id === currentUserData.user_id)) && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 rounded-lg p-2 bg-primary/5 border border-primary/20">
                  <div className="w-6 text-center shrink-0">
                    <span className="text-xs font-bold text-primary tabular-nums">
                      #{currentUserData.rank}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary border border-primary/20">
                      {getInitials(currentUserData)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">You</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-primary/80">
                        <Upload className="h-3 w-3" aria-hidden="true" />{formatStat(currentUserData.note_count, true)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
