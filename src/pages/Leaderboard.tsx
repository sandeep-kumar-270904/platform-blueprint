import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from "@/hooks/useAuth";
import { Badge } from '@/components/ui/badge';

interface LeaderboardUser {
  _id: string;
  username: string;
  full_name: string;
  avatar: string;
  points: number;
  badges: { badgeId: string; earnedAt: string }[];
}

const CATEGORIES = ['All', 'Programming', 'Mathematics', 'Science', 'History', 'General Knowledge'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [myStats, setMyStats] = useState<{ rank: number; points: number } | null>(null);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const query = category === 'All' ? '' : `?category=${encodeURIComponent(category)}`;
        const res = await api.get(`/leaderboards/global${query}`);
        setLeaders(res.data);
        
        if (user) {
          const myRes = await api.get(`/leaderboards/global/me${query}`);
          setMyStats(myRes.data);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [category, user]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Global Leaderboard</h1>
          <p className="text-muted-foreground mt-2">See how you rank against other learners.</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {user && myStats && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={user.avatar ? `${import.meta.env.VITE_API_URL}${user.avatar}` : ''} />
                <AvatarFallback>{user.full_name?.charAt(0) || user.username?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold">Your Ranking</h3>
                <p className="text-muted-foreground">{category === 'All' ? 'Global' : category} Category</p>
              </div>
            </div>
            <div className="text-right flex items-center space-x-8">
              <div>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Rank</p>
                <p className="text-3xl font-extrabold text-primary">#{myStats.rank}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Points</p>
                <p className="text-3xl font-extrabold">{myStats.points}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Learners</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading leaderboard...</div>
          ) : (
            <div className="space-y-4">
              {leaders.map((leader, index) => (
                <div 
                  key={leader._id} 
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    user && leader._id === user.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index)}
                    </div>
                    <Avatar>
                      <AvatarImage src={leader.avatar ? `${import.meta.env.VITE_API_URL}${leader.avatar}` : ''} />
                      <AvatarFallback>{leader.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{leader.full_name || leader.username}</p>
                      <div className="flex gap-1 mt-1">
                        {leader.badges && leader.badges.length > 0 ? (
                          leader.badges.slice(0, 3).map(b => (
                            <Badge key={b.badgeId} variant="secondary" className="text-xs px-1 py-0 h-4">
                              {b.badgeId.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No badges yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-lg">
                    {leader.points} <span className="text-sm text-muted-foreground font-normal">pts</span>
                  </div>
                </div>
              ))}
              
              {leaders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No scores recorded in this category yet.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
