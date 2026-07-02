import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Clock,
  Download,
  Eye,
  TrendingUp,
  BookOpen,
  Star,
  Users,
} from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalNotes: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalStudyTime: 0,
    topNotes: [],
    recentActivity: [],
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("views", { ascending: false });

    if (notes) {
      const totalViews = notes.reduce((sum, n) => sum + (n.views || 0), 0);
      const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);
      const totalStudyTime = notes.reduce((sum, n) => sum + (n.study_time_minutes || 0), 0);

      setStats({
        totalNotes: notes.length,
        totalViews,
        totalDownloads,
        totalStudyTime,
        topNotes: notes.slice(0, 5),
        recentActivity: notes.filter((n) => n.last_viewed_at).slice(0, 5),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your notes performance and study habits</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
              <p className="text-xs text-muted-foreground">Your uploaded notes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">Across all notes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Total downloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
              </div>
              <p className="text-xs text-muted-foreground">Total study time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topNotes.map((note: any) => (
                  <div key={note.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground">{note.subject}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        <Eye className="h-3 w-3 mr-1" />
                        {note.views || 0}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {note.downloads || 0} downloads
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {note.rating || 0}
                      </span>
                    </div>
                    <Progress
                      value={(note.views || 0) / Math.max(stats.totalViews, 1) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
                {stats.topNotes.length === 0 && (
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
                <BarChart3 className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((note: any) => (
                  <div key={note.id} className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Last viewed:{" "}
                        {note.last_viewed_at
                          ? new Date(note.last_viewed_at).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {note.study_time_minutes || 0}min
                    </Badge>
                  </div>
                ))}
                {stats.recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
