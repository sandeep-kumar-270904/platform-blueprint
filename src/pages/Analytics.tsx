import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  BarChart3,
  Clock,
  Download,
  Eye,
  TrendingUp,
  BookOpen,
  Star,
  Users,
  BrainCircuit,
  Video,
  Target
} from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    notes: {
      totalNotes: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalStudyTime: 0,
      topNotes: [],
      recentActivity: [],
    },
    learning: {
      totalQuizzes: 0,
      averageQuizScore: 0
    },
    collaboration: {
      activeStudyGroups: 0,
      roommateConnections: 0
    },
    engagement: {
      sessionsHosted: 0,
      sessionsAttended: 0
    }
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      
      const notes = data.notes || [];
      const totalViews = notes.reduce((sum: any, n: any) => sum + (n.views || 0), 0);
      const totalDownloads = notes.reduce((sum: any, n: any) => sum + (n.downloads || 0), 0);
      const totalStudyTime = notes.reduce((sum: any, n: any) => sum + (n.study_time_minutes || 0), 0);

      setStats({
        notes: {
          totalNotes: notes.length,
          totalViews,
          totalDownloads,
          totalStudyTime,
          topNotes: notes.slice(0, 5),
          recentActivity: notes.filter((n: any) => n.last_viewed_at).slice(0, 5),
        },
        learning: data.learning || { totalQuizzes: 0, averageQuizScore: 0 },
        collaboration: data.collaboration || { activeStudyGroups: 0, roommateConnections: 0 },
        engagement: data.engagement || { sessionsHosted: 0, sessionsAttended: 0 }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-10 text-center md:text-left">
          <Badge variant="accent" className="mb-4">Platform Insights</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 display-font">Deep Analytics Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">Track your performance, connections, and learning milestones across the platform.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Section 1: Learning & Quizzes */}
            <ScrollReveal direction="up" delay={0.1}>
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BrainCircuit className="h-6 w-6 text-primary" /> Learning & Quizzes
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                      <Target className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.learning.totalQuizzes}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total quizzes taken</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.learning.averageQuizScore}%</div>
                      <p className="text-xs text-muted-foreground mt-1">Across all quizzes</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">
                        {Math.floor(stats.notes.totalStudyTime / 60)}h {stats.notes.totalStudyTime % 60}m
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total notes study time</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 2: Engagement & Connections */}
            <ScrollReveal direction="up" delay={0.2}>
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" /> Community & Engagement
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Study Groups</CardTitle>
                      <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.collaboration.activeStudyGroups}</div>
                      <p className="text-xs text-muted-foreground mt-1">Teams you are part of</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Roommate Connections</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.collaboration.roommateConnections}</div>
                      <p className="text-xs text-muted-foreground mt-1">Accepted matches</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sessions Hosted</CardTitle>
                      <Video className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.engagement.sessionsHosted}</div>
                      <p className="text-xs text-muted-foreground mt-1">Virtual classrooms created</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-scale border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sessions Attended</CardTitle>
                      <Video className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.engagement.sessionsAttended}</div>
                      <p className="text-xs text-muted-foreground mt-1">Virtual classrooms joined</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 3: Notes Hub Analytics */}
            <ScrollReveal direction="up" delay={0.3}>
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" /> Notes Performance
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                      <BookOpen className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.notes.totalNotes}</div>
                      <p className="text-xs opacity-70 mt-1">Your uploaded notes</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.notes.totalViews}</div>
                      <p className="text-xs text-muted-foreground mt-1">Across all notes</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold display-font">{stats.notes.totalDownloads}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total downloads</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Top Performing Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.notes.topNotes.map((note: any) => (
                          <div key={note.id} className="space-y-2 p-3 bg-secondary/20 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{note.title}</p>
                                <p className="text-xs text-muted-foreground">{note.subject}</p>
                              </div>
                              <Badge variant="secondary" className="ml-2 bg-background">
                                <Eye className="h-3 w-3 mr-1" />
                                {note.views || 0}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {note.downloads || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                {note.rating || 0}
                              </span>
                            </div>
                            <Progress
                              value={(note.views || 0) / Math.max(stats.notes.totalViews, 1) * 100}
                              className="h-1.5"
                            />
                          </div>
                        ))}
                        {stats.notes.topNotes.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No notes yet. Upload some to see analytics!
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.notes.recentActivity.map((note: any) => (
                          <div key={note.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                            <div className="flex-1 min-w-0 mr-4">
                              <p className="text-sm font-bold truncate">{note.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Last viewed:{" "}
                                {note.last_viewed_at
                                  ? new Date(note.last_viewed_at).toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 bg-background">
                              {note.study_time_minutes || 0}m study
                            </Badge>
                          </div>
                        ))}
                        {stats.notes.recentActivity.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No recent activity
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
