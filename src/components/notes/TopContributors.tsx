import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Upload, Star, TrendingUp, Loader2 } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

interface Contributor {
  user_id: string;
  username: string | null;
  full_name: string | null;
  note_count: number;
  avg_rating: number;
  total_views: number;
  total_downloads: number;
}

const RANK_STYLES = [
  { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", icon: "🥇" },
  { bg: "bg-slate-400/10", border: "border-slate-400/30", text: "text-slate-500", icon: "🥈" },
  { bg: "bg-orange-600/10", border: "border-orange-600/30", text: "text-orange-600", icon: "🥉" },
];

export const TopContributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributors();
  }, []);

  const loadContributors = async () => {
    // Get all notes with their stats
    const { data: notes } = await supabase
      .from("notes")
      .select("user_id, rating, views, downloads");

    if (!notes || notes.length === 0) { setLoading(false); return; }

    // Aggregate by user
    const userMap = new Map<string, { count: number; totalRating: number; ratedCount: number; views: number; downloads: number }>();
    notes.forEach(n => {
      const prev = userMap.get(n.user_id) || { count: 0, totalRating: 0, ratedCount: 0, views: 0, downloads: 0 };
      prev.count++;
      if (n.rating && Number(n.rating) > 0) { prev.totalRating += Number(n.rating); prev.ratedCount++; }
      prev.views += n.views || 0;
      prev.downloads += n.downloads || 0;
      userMap.set(n.user_id, prev);
    });

    // Get profiles
    const userIds = [...userMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const result: Contributor[] = userIds.map(uid => {
      const stats = userMap.get(uid)!;
      const profile = profileMap.get(uid);
      return {
        user_id: uid,
        username: profile?.username || null,
        full_name: profile?.full_name || null,
        note_count: stats.count,
        avg_rating: stats.ratedCount > 0 ? Math.round((stats.totalRating / stats.ratedCount) * 10) / 10 : 0,
        total_views: stats.views,
        total_downloads: stats.downloads,
      };
    });

    // Sort by composite score: uploads * 3 + avg_rating * 2 + downloads
    result.sort((a, b) => {
      const scoreA = a.note_count * 3 + a.avg_rating * 2 + a.total_downloads;
      const scoreB = b.note_count * 3 + b.avg_rating * 2 + b.total_downloads;
      return scoreB - scoreA;
    });

    setContributors(result.slice(0, 10));
    setLoading(false);
  };

  const getDisplayName = (c: Contributor) => c.full_name || c.username || "Anonymous";
  const getInitials = (c: Contributor) => getDisplayName(c).slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <Card className="bg-[var(--surface-sunk)] border-[var(--border)] shadow-sm">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--ink-soft)]" />
        </CardContent>
      </Card>
    );
  }

  if (contributors.length === 0) {
    return (
      <Card className="bg-[var(--surface-sunk)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[var(--ink)]">
            <Trophy className="h-5 w-5 text-[var(--accent)]" /> Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-soft)] text-center py-6">
            No contributors yet. Upload notes to appear here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--surface-sunk)] border-[var(--border)] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-[var(--ink)]">
          <Trophy className="h-5 w-5 text-[var(--accent)]" /> Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contributors.map((c, i) => {
          const rankStyle = i < 3 ? RANK_STYLES[i] : null;

          return (
            <ScrollReveal key={c.user_id} delay={i * 0.04} direction="left">
              <div
                className={`flex items-center gap-3 rounded-lg p-2.5 transition-all hover:shadow-sm ${
                  rankStyle ? `${rankStyle.bg} border ${rankStyle.border}` : "hover:bg-muted/50"
                }`}
              >
                {/* Rank */}
                <div className="w-6 text-center shrink-0">
                  {rankStyle ? (
                    <span className="text-base">{rankStyle.icon}</span>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--ink-soft)] tabular-nums">
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={`text-xs ${rankStyle ? `${rankStyle.bg} ${rankStyle.text}` : "bg-primary/10 text-primary"}`}>
                    {getInitials(c)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[var(--ink)]">{getDisplayName(c)}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--ink-soft)]">
                    <span className="flex items-center gap-1">
                      <Upload className="h-3 w-3" />{c.note_count}
                    </span>
                    {c.avg_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" />{c.avg_rating}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />{c.total_views}
                    </span>
                  </div>
                </div>

                {/* Score badge for top 3 */}
                {i < 3 && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {Math.round(c.note_count * 3 + c.avg_rating * 2 + c.total_downloads)} pts
                  </Badge>
                )}
              </div>
            </ScrollReveal>
          );
        })}
      </CardContent>
    </Card>
  );
};
