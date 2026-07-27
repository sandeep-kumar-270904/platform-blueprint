import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Eye, Heart, Users, Sparkles, ArrowRight, 
  FileText, MessageSquare, Bell, Upload, CornerDownRight, CheckCircle2 
} from "lucide-react";

interface CreatorsSummaryData {
  totalPiecesPublished: number;
  totalViews: number;
  totalLikes: number;
  followerCount: number;
  recentActivity: any[];
}

export const CreatorDashboardWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<CreatorsSummaryData>({
    queryKey: ['creators-dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/creators-summary');
      return res.data;
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading Creators Zone summary...
        </CardContent>
      </Card>
    );
  }

  const stats = data || {
    totalPiecesPublished: 0,
    totalViews: 0,
    totalLikes: 0,
    followerCount: 0,
    recentActivity: []
  };

  const hasActivity = stats.totalPiecesPublished > 0 || stats.totalViews > 0 || stats.totalLikes > 0 || stats.followerCount > 0;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'creator_like': return <Heart className="h-3.5 w-3.5 text-red-500" />;
      case 'creator_comment': return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case 'creator_reply': return <CornerDownRight className="h-3.5 w-3.5 text-purple-500" />;
      case 'creator_publish': return <Video className="h-3.5 w-3.5 text-indigo-500" />;
      default: return <Bell className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getActivityText = (act: any) => {
    switch (act.type) {
      case 'creator_like': return 'Someone liked your content';
      case 'creator_comment': return 'New comment on your upload';
      case 'creator_reply': return 'New reply to your comment';
      case 'creator_publish': return 'A creator you follow posted new content!';
      default: return act.message || 'New creator notification';
    }
  };

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 dark:from-gray-900 dark:to-indigo-950/20 border-indigo-100/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              Creators Zone Hub
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-semibold">
                Studio
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your uploads, audience growth, and community interactions.
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-xs font-medium">
          <Link to="/creators?tab=my_content">
            My Content <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {!hasActivity ? (
          <div className="py-8 px-4 text-center rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 dark:border-indigo-500/20">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h4 className="font-semibold text-sm mb-1">Start Your Creative Journey!</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Share your articles, tutorials, videos, or coding projects with the community and start building your personal brand today.
            </p>
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Link to="/creators?action=upload">
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Publish First Content
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* 4 Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-border/40 shadow-2xs text-center hover:border-indigo-200 transition-all">
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" /> Published
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalPiecesPublished}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-border/40 shadow-2xs text-center hover:border-indigo-200 transition-all">
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <Eye className="h-3.5 w-3.5 text-blue-500" /> Views
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalViews}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-border/40 shadow-2xs text-center hover:border-indigo-200 transition-all">
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <Heart className="h-3.5 w-3.5 text-red-500" /> Likes
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalLikes}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-border/40 shadow-2xs text-center hover:border-indigo-200 transition-all">
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <Users className="h-3.5 w-3.5 text-emerald-500" /> Followers
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.followerCount}
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Bell className="h-3 w-3" /> Recent Activity
                </h4>
                <Link to="/creators" className="text-[11px] text-indigo-600 hover:underline">View Feed</Link>
              </div>

              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-1.5">
                  {stats.recentActivity.slice(0, 3).map((act, index) => (
                    <div
                      key={act._id || index}
                      onClick={() => navigate(act.link || '/creators')}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-border/30 transition-all cursor-pointer text-xs"
                    >
                      <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 shrink-0">
                        {getActivityIcon(act.type)}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate text-gray-800 dark:text-gray-200">
                          {act.title || getActivityText(act)}
                        </p>
                        {act.message && (
                          <p className="text-[11px] text-muted-foreground truncate">{act.message}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {act.createdAt ? new Date(act.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg bg-gray-50/50 dark:bg-gray-800/40 border border-dashed text-xs text-muted-foreground">
                  No recent notifications or engagement updates yet.
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
