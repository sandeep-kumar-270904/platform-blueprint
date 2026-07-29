import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowRight, Clock, Star, Calendar, MessageSquare, ShieldCheck } from "lucide-react";
import { useMySessions, useSkillRequests, useUserBadges } from "@/hooks/useSkillSwap";
import { useAuth } from "@/hooks/useAuth";

export const SkillSwapDashboardWidget: React.FC = () => {
  const { user } = useAuth();
  const { data: sessions, isLoading: sessionsLoading } = useMySessions();
  const { data: requests, isLoading: requestsLoading } = useSkillRequests();
  const { data: badges, isLoading: badgesLoading } = useUserBadges(user?.id || '');

  const upcomingSessions = sessions?.filter((s: any) => s.status === 'scheduled') || [];
  const pendingIncoming = requests?.incoming?.filter((r: any) => r.status === 'pending') || [];

  if (sessionsLoading || requestsLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading Skill Swap activity...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-5 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Skill Swap</h3>
              {(pendingIncoming.length > 0 || upcomingSessions.length > 0) && (
                <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2 py-0.5 shadow-sm">
                  Action Needed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your skill exchange sessions, incoming requests, and earned badges.
            </p>
          </div>
        </div>
        <Link to="/skill-swap">
          <Button className="gap-2 shrink-0 shadow-sm font-semibold">
            Explore Skill Swap <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sessions Widget */}
        <Card className="border-border/60 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between border-b border-border/40">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base font-bold">Upcoming Sessions</CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {upcomingSessions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed rounded-xl border-border/60 bg-muted/20">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                  <p className="text-sm font-medium text-foreground mb-1">No upcoming sessions</p>
                  <p className="text-xs text-muted-foreground mb-4">Accept requests or browse offers to schedule one.</p>
                  <Link to="/skill-swap">
                    <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5">
                      Find Skills <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {upcomingSessions.map((session: any) => (
                    <div key={session._id} className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-bold text-sm text-foreground truncate min-w-0">
                          {session.request?.offer?.skillName || "Skill Session"}
                        </h4>
                        <Badge className="bg-blue-500/10 text-blue-600">Scheduled</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(session.scheduledAt).toLocaleString()} ({session.durationMinutes} min)
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                        <span>Participants: {session.participants?.map((p: any) => p.name || p.username).join(', ')}</span>
                        <Link to={`/skill-swap`}>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1">
                            Join <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Requests & Badges Widget */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between border-b border-border/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-base font-bold">Pending Requests</CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {pendingIncoming.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingIncoming.length === 0 ? (
                <div className="text-center py-6 px-4 bg-muted/20 rounded-xl">
                  <p className="text-xs text-muted-foreground">No pending requests right now.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {pendingIncoming.map((req: any) => (
                    <div key={req._id} className="p-3 rounded-xl border border-border/60 bg-card flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm">{req.offer?.skillName}</h4>
                        <p className="text-xs text-muted-foreground">From: {req.fromUser?.name}</p>
                      </div>
                      <Link to="/skill-swap">
                        <Button size="sm" variant="outline" className="h-7 text-xs">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between border-b border-border/40">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-base font-bold">My Badges</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {!badges || badges.length === 0 ? (
                 <p className="text-xs text-muted-foreground text-center">Complete sessions and earn high ratings to unlock badges!</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                   {badges.map((b: any, i: number) => (
                      <Badge key={i} variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 gap-1">
                        <ShieldCheck className="h-3 w-3" /> {b.badgeType.replace('-', ' ').toUpperCase()}
                      </Badge>
                   ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
