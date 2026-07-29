import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardUser {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  college: string;
  degree: string;
  xp: number;
  levelTitle: string;
}

export const PlacementLeaderboard = () => {
  const [scope, setScope] = useState('global');
  const [timeframe, setTimeframe] = useState('all');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    setPage(1);
    setUsers([]);
    fetchLeaderboard(1, true);
  }, [scope, timeframe]);

  const fetchLeaderboard = async (pageNum: number, reset: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/placement-gamification/leaderboard?scope=${scope}&timeframe=${timeframe}&page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const newUsers = Array.isArray(data) ? data : data.users;
        setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
        setHasMore(data.currentPage < data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeaderboard(nextPage);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <><Medal className="h-6 w-6 text-yellow-500" aria-hidden="true" /><span className="sr-only">Rank 1 (Gold)</span></>;
    if (rank === 2) return <><Medal className="h-6 w-6 text-gray-400" aria-hidden="true" /><span className="sr-only">Rank 2 (Silver)</span></>;
    if (rank === 3) return <><Medal className="h-6 w-6 text-amber-600" aria-hidden="true" /><span className="sr-only">Rank 3 (Bronze)</span></>;
    return <span className="text-muted-foreground font-bold text-lg w-6 text-center" aria-label={`Rank ${rank}`}>{rank}</span>;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-primary" />
            Top Performers
          </CardTitle>
          <div className="flex flex-col gap-2">
            <Tabs value={scope} onValueChange={setScope}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="global">Global</TabsTrigger>
                <TabsTrigger value="college">College</TabsTrigger>
                <TabsTrigger value="branch">Branch</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-4 max-h-[500px] overflow-y-auto pr-2">
          {users.map(u => (
            <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {getRankIcon(u.rank)}
                </div>
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarImage src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} />
                  <AvatarFallback>{u.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm leading-none flex items-center gap-2">
                    {u.full_name || u.username}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {u.college || 'No college'} {u.degree ? `• ${u.degree}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="font-bold">
                  {u.xp} XP
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{u.levelTitle}</p>
              </div>
            </div>
          ))}

          {users.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No users found in this leaderboard yet.
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button 
                variant="outline" 
                onClick={handleLoadMore} 
                disabled={isLoading}
                aria-label="Load more users"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
          
          {isLoading && (
            <div aria-live="polite" className="sr-only">
              Loading more users...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
