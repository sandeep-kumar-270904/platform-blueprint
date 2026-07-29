import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuizDashboard } from "@/hooks/useQuizHub";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowRight, Brain, Clock, Trophy, Target, Flame, Calendar, Database, PlayCircle, BarChart3, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BADGE_DEFINITIONS = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first quiz attempt.', icon: <Trophy className="h-6 w-6 text-yellow-500" /> },
  { id: 'on_fire', name: 'On Fire', description: 'Reach a 3-day quiz streak.', icon: <Flame className="h-6 w-6 text-orange-500" /> },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Reach a 7-day quiz streak.', icon: <Brain className="h-6 w-6 text-purple-500" /> },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Score 100% on any quiz with 5+ questions.', icon: <Target className="h-6 w-6 text-green-500" /> },
  { id: 'quiz_master', name: 'Quiz Master', description: 'Create a quiz that reaches 50+ attempts.', icon: <Database className="h-6 w-6 text-blue-500" /> },
  { id: 'live_wire', name: 'Live Wire', description: 'Participate in 5 live sessions.', icon: <PlayCircle className="h-6 w-6 text-red-500" /> },
  { id: 'category_master', name: 'Category Master', description: 'Complete 10 quizzes in a single category.', icon: <BarChart3 className="h-6 w-6 text-indigo-500" /> },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Finish a 10+ question quiz averaging under 10 seconds per question.', icon: <Clock className="h-6 w-6 text-cyan-500" /> },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Take a quiz after a 14+ day gap.', icon: <ArrowRight className="h-6 w-6 text-pink-500" /> }
];

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};


const MyQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const fetchIt = async () => {
      try {
        const dashboardData = await getQuizDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIt();
  }, []);

  useEffect(() => {
    if (!user) return;
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      newSocket.emit('join_user_room', user.id);
    });

    newSocket.on('quizStatsUpdated', (updates: { totalPoints: number, currentStreak: number, longestStreak: number }) => {
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            ...updates
          }
        };
      });
    });
    
    newSocket.on('badgeEarned', (badge: any) => {
      setData((prev: any) => {
        if (!prev) return prev;
        // Check if badge already exists to prevent duplicates during rapid updates
        if (prev.badges.some((b: any) => b.badgeId === badge.id)) return prev;
        return {
          ...prev,
          badges: [...prev.badges, { badgeId: badge.id, earnedAt: new Date().toISOString() }]
        };
      });
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </div>
    );
  }

  const hasActivity = data?.summary?.totalAttempts > 0 || data?.createdContent?.count > 0;

  const inProgressAttempt = data?.recentActivity?.find((a: any) => a.status === 'in_progress');

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Quiz Dashboard</h1>
            <p className="text-lg text-muted-foreground">Your centralized hub for quiz activity and progress.</p>
          </div>
          <Link to="/quizzes">
            <Button variant="outline"><Brain className="mr-2 h-4 w-4" /> Browse Quizzes</Button>
          </Link>
        </div>

        {!hasActivity ? (
          <Card className="text-center py-20 border-dashed">
            <CardContent>
              <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No activity yet</h3>
              <p className="text-muted-foreground mb-6">You haven't taken or created any quizzes yet.</p>
              <Link to="/quizzes">
                <Button>Start Practicing</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <Flame className="h-8 w-8 text-orange-500 mb-2" />
                  <p className="text-3xl font-bold">{data.summary.currentStreak} Days</p>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  {data.summary.currentStreak > 0 && data.recentActivity && data.recentActivity.length > 0 && !isToday(data.recentActivity[0].date) && (
                    <Badge variant="destructive" className="mt-2 text-[10px] animate-pulse">Streak at Risk!</Badge>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                  <p className="text-3xl font-bold">{data.summary.totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <Target className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-3xl font-bold">#{data.summary.globalRank}</p>
                  <p className="text-sm text-muted-foreground">Global Rank</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <Brain className="h-8 w-8 text-purple-500 mb-2" />
                  <p className="text-3xl font-bold">{data.summary.completedAttempts}</p>
                  <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                
                {inProgressAttempt && (
                  <Card className="border-primary/50 shadow-sm bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <PlayCircle className="h-5 w-5" /> Continue where you left off
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-lg">{inProgressAttempt.quizTitle}</h4>
                        <p className="text-sm text-muted-foreground">Started {formatDistanceToNow(new Date(inProgressAttempt.date), { addSuffix: true })}</p>
                      </div>
                      <Link to={`/quizzes/${inProgressAttempt.quizId}/take`}>
                        <Button>Resume Quiz</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your last 10 quiz attempts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.recentActivity.filter((a: any) => a.status !== 'in_progress').length === 0 ? (
                      <p className="text-muted-foreground text-sm">No recent activity.</p>
                    ) : (
                      data.recentActivity.filter((a: any) => a.status !== 'in_progress').map((item: any) => (
                        <div key={item._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.quizTitle}</h4>
                              {item.isLive && <Badge variant="secondary" className="text-xs">Live</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {format(new Date(item.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {item.status === 'completed' ? (
                                <p className={`font-bold ${item.score >= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                                  {Math.round(item.score)}%
                                </p>
                              ) : (
                                <Badge variant="destructive" className="text-xs">Abandoned</Badge>
                              )}
                            </div>
                            {item.status === 'completed' && (
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/attempts/${item._id}/results`)}>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data.createdContent?.count > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Your Quizzes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Quizzes Created</span>
                            <span className="font-bold">{data.createdContent.count}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Total Attempts</span>
                            <span className="font-bold">{data.createdContent.totalAttempts}</span>
                          </div>
                            <Link to="/creator-analytics">
                              <Button variant="outline" className="w-full mt-2">View Analytics</Button>
                            </Link>
                            {data.createdContent.pendingReportsCount > 0 && (
                              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-red-600 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <span>You have {data.createdContent.pendingReportsCount} report(s) pending review on your quizzes.</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                    </Card>
                  )}

                  {data.questionBank?.count > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Question Bank</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Saved Items</span>
                            <span className="font-bold">{data.questionBank.count}</span>
                          </div>
                          {data.questionBank.mostUsed && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Most Used ({data.questionBank.mostUsed.usageCount} times)</p>
                              <p className="text-sm font-medium line-clamp-2">{data.questionBank.mostUsed.questionText}</p>
                            </div>
                          )}
                          <Link to="/question-bank">
                            <Button variant="outline" className="w-full mt-2">Manage Bank</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.upcomingSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming live sessions.</p>
                    ) : (
                      data.upcomingSessions.map((session: any) => (
                        <div key={session._id} className="p-3 border rounded-lg">
                          <h4 className="font-medium line-clamp-1">{session.quiz?.title || 'Unknown Quiz'}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(session.scheduledStartAt), 'MMM d, h:mm a')}
                          </p>
                          <Button 
                            className="w-full mt-3" 
                            size="sm"
                            onClick={() => navigate(`/quizzes/${session.quiz?._id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Badges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.badges.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Complete quizzes to earn badges!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {data.badges.map((badge: any, i: number) => {
                          const icon = badge.badgeId === 'first_steps' ? '🎯' : 
                                      badge.badgeId === 'on_fire' ? '🔥' : 
                                      badge.badgeId === 'unstoppable' ? '⚡' : 
                                      badge.badgeId === 'perfectionist' ? '👑' :
                                      badge.badgeId === 'quiz_master' ? '🎓' : 
                                      badge.badgeId === 'live_wire' ? '📻' : '🌟';
                          return (
                            <div key={i} className="flex items-center justify-center h-10 w-10 bg-muted rounded-full text-xl" title={`Earned ${format(new Date(badge.earnedAt), 'MMM d, yyyy')}`}>
                              {icon}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Link to="/profile">
                      <Button variant="link" className="w-full mt-2 h-auto py-2">View Full Profile</Button>
                    </Link>
                  </CardContent>
                </Card>

                {data.subscriptions?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.subscriptions.map((sub: any) => (
                        <div key={sub._id} className="flex justify-between items-center">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-medium truncate">{sub.title}</p>
                            <p className="text-xs text-muted-foreground">{sub.category}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/quizzes/${sub._id}`)}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuizzes;
