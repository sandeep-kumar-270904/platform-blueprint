import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Bookmark, Users, AlertTriangle, Share2, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const CommunityDashboardWidget = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/community/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" /> Community Activity
      </h3>
      
      {/* Mini Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Posts</p>
              <p className="text-2xl font-bold">{data.stats.posts}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Likes Received</p>
              <p className="text-2xl font-bold">{data.stats.likesReceived}</p>
            </div>
            <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
              <Heart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Comments</p>
              <p className="text-2xl font-bold">{data.stats.commentsReceived}</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <MessageSquare className="h-5 w-5 fill-purple-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Followers</p>
              <p className="text-2xl font-bold">{data.stats.followers}</p>
            </div>
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alerts and Prompts */}
        <div className="space-y-4">
          {data.hasWarnings && (
            <Card className="border-red-200 bg-red-50/50 shadow-sm">
              <CardContent className="p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">Moderation Alert</h4>
                  <p className="text-sm text-red-600 mt-1">You have {data.pendingPostsCount} post(s) pending review or a recent warning. Please review our community guidelines.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {data.unsharedCerts?.map((cert: any) => (
            <Card key={cert._id} className="border-primary/30 bg-primary/5 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-primary-900">New Achievement Unlocked!</h4>
                  <p className="text-sm text-muted-foreground mt-1">Share your <strong>{cert.name}</strong> certification with the community.</p>
                </div>
                <Button 
                  size="sm" 
                  className="shrink-0"
                  onClick={() => navigate(`/community?composer=true&template=achievement&cert_id=${cert._id}&cert_name=${encodeURIComponent(cert.name)}`)}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full shrink-0">
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Saved Posts</h4>
                  <p className="text-sm text-muted-foreground">{data.savedPosts?.count || 0} bookmarks saved.</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/community?tab=saved">View Saved</Link>
              </Button>
            </CardContent>
          </Card>

          {data.recentNotifications?.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {data.recentNotifications.map((notif: any) => (
                    <div key={notif._id} className="flex items-start gap-2 text-sm">
                      <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-muted-foreground">{notif.message}</p>
                    </div>
                  ))}
                </div>
                <Button variant="link" size="sm" className="px-0 mt-2 h-auto" asChild>
                  <Link to="/notifications">View all notifications</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <Card className="h-full border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPosts?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">You haven't posted anything yet.</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link to="/community">Go to Community</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentPosts.map((post: any) => (
                  <div key={post._id} className="flex items-start justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="max-w-[70%]">
                      <p className="text-sm truncate font-medium">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] capitalize bg-secondary/40">{post.template}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center"><Heart className="h-3 w-3 mr-1" /> {post.like_count}</span>
                      <span className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> {post.comment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.recentPosts?.length > 0 && (
              <Button variant="ghost" className="w-full mt-4 text-sm" asChild>
                <Link to="/profile">View All on Profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
