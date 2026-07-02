import { useState, useCallback } from "react";
import { Trophy, Flame, Zap, TrendingUp, Medal, Crown, Star, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";

interface TopIdea {
  rank: number;
  id: string;
  title: string;
  author: string;
  upvotes: number;
  category: string;
}

interface ActiveCreator {
  rank: number;
  user_id: string;
  name: string;
  ideas: number;
  upvotes: number;
}

interface Stats {
  totalIdeas: number;
  activeCreators: number;
  thisWeek: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
};

const getRankBg = (rank: number) => {
  if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
  if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/30";
  return "";
};

export const InnovationLeaderboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("ideas");
  const [topIdeas, setTopIdeas] = useState<TopIdea[]>([]);
  const [activeCreators, setActiveCreators] = useState<ActiveCreator[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIdeas: 0, activeCreators: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<{ rank: number; total: number; upvotes: number; ideas: number } | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    // Fetch top ideas by upvotes (deterministic tiebreaker on id to prevent flicker)
    const { data: ideas } = await supabase
      .from("ideas")
      .select("id, title, category, upvotes, user_id")
      .eq("is_public", true)
      .order("upvotes", { ascending: false })
      .order("id", { ascending: true })
      .limit(10);

    if (ideas && ideas.length > 0) {
      const userIds = [...new Set(ideas.map(i => i.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const nextTop = ideas.map((idea, idx) => ({
        rank: idx + 1,
        id: idea.id,
        title: idea.title,
        author: (profiles || []).find(p => p.id === idea.user_id)?.username || "Anonymous",
        upvotes: idea.upvotes || 0,
        category: idea.category,
      }));
      // Only update affected rows to minimize re-renders / flicker
      setTopIdeas(prev => {
        if (
          prev.length === nextTop.length &&
          prev.every((p, i) => p.id === nextTop[i].id && p.upvotes === nextTop[i].upvotes && p.rank === nextTop[i].rank)
        ) return prev;
        return nextTop;
      });
    } else {
      setTopIdeas(prev => (prev.length === 0 ? prev : []));
    }

    // Fetch all public ideas to compute creator stats
    const { data: allIdeas } = await supabase
      .from("ideas")
      .select("user_id, upvotes, created_at")
      .eq("is_public", true);

    if (allIdeas && allIdeas.length > 0) {
      const creatorMap: Record<string, { ideas: number; upvotes: number }> = {};
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      let thisWeekCount = 0;

      allIdeas.forEach(idea => {
        if (!creatorMap[idea.user_id]) creatorMap[idea.user_id] = { ideas: 0, upvotes: 0 };
        creatorMap[idea.user_id].ideas++;
        creatorMap[idea.user_id].upvotes += idea.upvotes || 0;
        if (new Date(idea.created_at) > oneWeekAgo) thisWeekCount++;
      });

      // Deterministic sort: upvotes desc, ideas desc, user_id asc
      const sortedAll = Object.entries(creatorMap).sort((a, b) => {
        if (b[1].upvotes !== a[1].upvotes) return b[1].upvotes - a[1].upvotes;
        if (b[1].ideas !== a[1].ideas) return b[1].ideas - a[1].ideas;
        return a[0].localeCompare(b[0]);
      });
      const creatorEntries = sortedAll.slice(0, 10);

      const creatorIds = creatorEntries.map(([uid]) => uid);
      const { data: creatorProfiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", creatorIds);

      const nextCreators = creatorEntries.map(([uid, data], idx) => ({
        rank: idx + 1,
        user_id: uid,
        name: (creatorProfiles || []).find(p => p.id === uid)?.username || "Anonymous",
        ideas: data.ideas,
        upvotes: data.upvotes,
      }));
      setActiveCreators(prev => {
        if (
          prev.length === nextCreators.length &&
          prev.every((p, i) =>
            p.user_id === nextCreators[i].user_id &&
            p.upvotes === nextCreators[i].upvotes &&
            p.ideas === nextCreators[i].ideas &&
            p.rank === nextCreators[i].rank
          )
        ) return prev;
        return nextCreators;
      });

      setStats(prev => {
        const next = {
          totalIdeas: allIdeas.length,
          activeCreators: Object.keys(creatorMap).length,
          thisWeek: thisWeekCount,
        };
        if (prev.totalIdeas === next.totalIdeas && prev.activeCreators === next.activeCreators && prev.thisWeek === next.thisWeek) return prev;
        return next;
      });

      if (user) {
        const myIndex = sortedAll.findIndex(([uid]) => uid === user.id);
        if (myIndex >= 0) {
          const [, mine] = sortedAll[myIndex];
          setMyRank(prev => {
            const next = { rank: myIndex + 1, total: sortedAll.length, upvotes: mine.upvotes, ideas: mine.ideas };
            if (prev && prev.rank === next.rank && prev.total === next.total && prev.upvotes === next.upvotes && prev.ideas === next.ideas) return prev;
            return next;
          });
        } else {
          setMyRank(prev => (prev === null ? prev : null));
        }
      } else {
        setMyRank(prev => (prev === null ? prev : null));
      }
    } else {
      setActiveCreators(prev => (prev.length === 0 ? prev : []));
      setStats(prev => (prev.totalIdeas === 0 && prev.activeCreators === 0 && prev.thisWeek === 0 ? prev : { totalIdeas: 0, activeCreators: 0, thisWeek: 0 }));
      setMyRank(prev => (prev === null ? prev : null));
    }

    setLoading(false);
  }, [user]);

  // Realtime: refresh on any ideas mutation (insert/update/delete) — covers
  // upvotes, new ideas, and deletions. Polling fallback ensures we don't drift
  // if the WebSocket stalls.
  const syncStatus = useRealtimeSync({
    channelName: "leaderboard-rt",
    filters: [{ table: "ideas" }],
    onChange: fetchLeaderboard,
    pollIntervalMs: 25000,
  });

  const maxUpvotes = topIdeas.length > 0 ? topIdeas[0].upvotes : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Innovation Leaderboard</h2>
            <p className="text-muted-foreground">Top performers across the Innovation Hub</p>
          </div>
        </div>
        <SyncStatusIndicator status={syncStatus} />
      </div>

      {/* My Rank — updates live as upvotes / ideas change */}
      {user && myRank && (
        <motion.div
          key={`${myRank.rank}-${myRank.upvotes}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="my-rank"
        >
          <Card className="border-primary/40 bg-primary text-primary-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {getRankIcon(myRank.rank)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Your rank</p>
                <p className="text-xl font-bold">
                  #{myRank.rank} <span className="text-sm font-normal text-muted-foreground">of {myRank.total}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm"><span className="font-bold text-primary">{myRank.upvotes}</span> upvotes</p>
                <p className="text-xs text-muted-foreground">{myRank.ideas} idea{myRank.ideas === 1 ? "" : "s"}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Ideas", value: stats.totalIdeas.toLocaleString(), icon: Star, color: "text-yellow-500" },
          { label: "Active Creators", value: stats.activeCreators.toLocaleString(), icon: Flame, color: "text-orange-500" },
          { label: "Top Upvotes", value: maxUpvotes.toLocaleString(), icon: Zap, color: "text-blue-500" },
          { label: "This Week", value: `+${stats.thisWeek}`, icon: TrendingUp, color: "text-green-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ideas" className="gap-2"><Star className="h-4 w-4" /> Top Ideas</TabsTrigger>
            <TabsTrigger value="creators" className="gap-2"><Flame className="h-4 w-4" /> Active Creators</TabsTrigger>
          </TabsList>

          {/* Top Ideas */}
          <TabsContent value="ideas" className="space-y-3 mt-4">
            {topIdeas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No ideas yet. Be the first to post!</p>
            ) : topIdeas.map((idea, i) => (
              <motion.div key={idea.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`${getRankBg(idea.rank)} transition-all hover:shadow-md`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {getRankIcon(idea.rank)}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{idea.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{idea.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{idea.author}</span>
                        <Badge variant="outline" className="text-[10px]">{idea.category}</Badge>
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="font-bold text-primary">{idea.upvotes}</p>
                      <p className="text-[10px] text-muted-foreground">upvotes</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Active Creators */}
          <TabsContent value="creators" className="space-y-3 mt-4">
            {activeCreators.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No creators yet.</p>
            ) : activeCreators.map((creator, i) => {
              const maxPts = activeCreators[0]?.upvotes || 1;
              return (
                <motion.div key={creator.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`${getRankBg(creator.rank)} transition-all hover:shadow-md`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      {getRankIcon(creator.rank)}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{creator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{creator.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Progress value={(creator.upvotes / maxPts) * 100} className="h-1.5 flex-1 max-w-[120px]" />
                          <span className="text-xs text-muted-foreground">{creator.upvotes} upvotes</span>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <p className="font-bold">{creator.ideas}</p>
                        <p className="text-[10px] text-muted-foreground">ideas</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
