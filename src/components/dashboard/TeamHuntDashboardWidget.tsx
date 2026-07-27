import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, ArrowRight, Check, X, ClipboardList, Sparkles, 
  Crown, Clock, AlertCircle, TrendingUp, ChevronDown, ChevronUp, Bell, Compass
} from "lucide-react";
import { useMyTeams, useMyApplications, useMyInvites, useRespondToInvite, useTrendingSkillGaps } from "@/hooks/useTeams";
import { SecondChanceBanner } from "@/components/team/SecondChanceBanner";
import { toast } from "sonner";

export const TeamHuntDashboardWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: teamsData, isLoading: teamsLoading } = useMyTeams();
  const { data: appsData, isLoading: appsLoading } = useMyApplications();
  const { data: invitesData, isLoading: invitesLoading } = useMyInvites();
  const { data: trendingData } = useTrendingSkillGaps();
  const { mutate: respondInvite, isPending: respondingInvite } = useRespondToInvite();
  
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [showSkillGap, setShowSkillGap] = useState<boolean>(true);
  const [dismissedSkillGap, setDismissedSkillGap] = useState<boolean>(false);

  const handleInviteResponse = (inviteId: string, status: 'accepted' | 'declined') => {
    setActingOn(inviteId);
    respondInvite({ inviteId, status }, {
      onSuccess: () => {
        toast.success(`Invite ${status}`);
        setActingOn(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to ${status} invite`);
        setActingOn(null);
      }
    });
  };

  const createdTeams = teamsData?.created || [];
  const joinedTeams = teamsData?.joined || [];
  const pendingInvites = invitesData || [];
  const applications = appsData || [];
  const trendingSkills = trendingData?.trendingSkills || [];

  if (teamsLoading && appsLoading && invitesLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading Team Hunt activity...
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-semibold">Open</Badge>;
      case 'full':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-semibold">Full</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px] font-semibold">Completed</Badge>;
      case 'closed':
      default:
        return <Badge className="bg-muted text-muted-foreground text-[11px] font-semibold">Closed</Badge>;
    }
  };

  const getAppStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> Accepted</Badge>;
      case 'rejected':
      case 'declined':
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[11px] font-semibold flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    }
  };

  const hasActivity = createdTeams.length > 0 || joinedTeams.length > 0 || applications.length > 0 || pendingInvites.length > 0 || trendingSkills.length > 0;

  return (
    <div className="space-y-6">
      {/* Header section with Notification-style Badge for Pending Invites */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-5 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Team Hunt Hub</h3>
              {pendingInvites.length > 0 && (
                <Badge className="bg-rose-500 text-white font-bold text-xs px-2 py-0.5 animate-bounce shadow-sm flex items-center gap-1">
                  <Bell className="h-3 w-3 fill-current" />
                  {pendingInvites.length} Pending {pendingInvites.length === 1 ? 'Invite' : 'Invites'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live sync of your created teams, applications, invites, and skill gap advisor.
            </p>
          </div>
        </div>
        <Link to="/team-hunt">
          <Button className="gap-2 shrink-0 shadow-sm font-semibold">
            <Compass className="h-4 w-4" /> Explore Team Hunt <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Pending Invites Alert Banner */}
      {pendingInvites.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5 shadow-sm overflow-hidden animate-in fade-in-50 duration-300">
          <CardHeader className="pb-3 pt-4 px-5 bg-rose-500/10 border-b border-rose-500/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <CardTitle className="text-sm font-bold text-rose-950 dark:text-rose-100">
                You have {pendingInvites.length} pending team invite{pendingInvites.length > 1 ? 's' : ''}!
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background/80 border-rose-500/30 font-bold text-rose-600 dark:text-rose-400">
              Action Required
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {pendingInvites.map((invite: any) => (
              <div key={invite._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-background/80 border border-border/50 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {(invite.invitedBy?.username || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{invite.team?.title || "Project Team"}</h4>
                    <p className="text-xs text-muted-foreground">
                      Invited by <strong className="text-foreground">{invite.invitedBy?.username || invite.invitedBy?.full_name || "Team Founder"}</strong>
                      {invite.team?.category && ` • ${invite.team.category}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:self-center self-end">
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                    onClick={() => handleInviteResponse(invite._id, 'accepted')}
                    disabled={actingOn === invite._id || respondingInvite}
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 px-3 text-xs border-rose-200 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold gap-1"
                    onClick={() => handleInviteResponse(invite._id, 'declined')}
                    disabled={actingOn === invite._id || respondingInvite}
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grid for My Teams & My Applications */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My Teams Widget */}
        <Card className="border-border/60 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between border-b border-border/40">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base font-bold">My Teams</CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {createdTeams.length + joinedTeams.length}
                </Badge>
              </div>
              <Link to="/team-hunt/create">
                <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1">
                  + Create Team
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {createdTeams.length === 0 && joinedTeams.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed rounded-xl border-border/60 bg-muted/20">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                  <p className="text-sm font-medium text-foreground mb-1">No active teams yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start your own project or join existing squads!</p>
                  <Link to="/team-hunt">
                    <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5">
                      Explore Teams <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* Created Teams */}
                  {createdTeams.map((team: any) => (
                    <div key={team._id} className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all shadow-2xs group">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                          <h4 className="font-bold text-sm text-foreground truncate">{team.title}</h4>
                        </div>
                        {getStatusBadge(team.status)}
                      </div>
                      {team.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{team.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            {team.teamSize?.current || 1}/{team.teamSize?.max || 4} Members
                          </span>
                          {team.reportCount > 0 && (
                            <span className="text-rose-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> {team.reportCount} Report(s)
                            </span>
                          )}
                        </div>
                        <Link to={`/team-hunt/${team._id}`}>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1">
                            Manage <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Joined Teams */}
                  {joinedTeams.map((team: any) => (
                    <div key={team._id} className="p-3.5 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-all shadow-2xs group">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-4 w-4 text-blue-500 shrink-0" />
                          <h4 className="font-bold text-sm text-foreground truncate">{team.title}</h4>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">Member</Badge>
                        </div>
                        {getStatusBadge(team.status)}
                      </div>
                      {team.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{team.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Users className="h-3.5 w-3.5 text-blue-500" />
                          {team.teamSize?.current || 1}/{team.teamSize?.max || 4} Members
                        </span>
                        <Link to={`/team-hunt/${team._id}`}>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1">
                            View <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
          <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
            <Link to="/team-hunt" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1">
              View all team activity in Team Hunt <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* My Applications Widget */}
        <Card className="border-border/60 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between border-b border-border/40">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-base font-bold">My Applications</CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {applications.length}
                </Badge>
              </div>
              <Link to="/team-hunt">
                <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1">
                  Find More
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {applications.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed rounded-xl border-border/60 bg-muted/20">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-60" />
                  <p className="text-sm font-medium text-foreground mb-1">No submitted applications</p>
                  <p className="text-xs text-muted-foreground mb-4">When you apply to join a project, track your application status here.</p>
                  <Link to="/team-hunt">
                    <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5">
                      Browse Open Teams <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {applications.map((app: any) => {
                    const teamObj = typeof app.team === 'object' ? app.team : null;
                    const teamId = teamObj ? teamObj._id : app.team;
                    const isRejected = app.status === 'rejected' || app.status === 'declined';

                    return (
                      <div key={app._id} className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all shadow-2xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-bold text-sm text-foreground truncate min-w-0">
                            {teamObj?.title || "Team Application"}
                          </h4>
                          {getAppStatusBadge(app.status)}
                        </div>
                        {app.message && (
                          <p className="text-xs text-muted-foreground italic bg-muted/40 p-2 rounded-lg mb-2 line-clamp-2">
                            "{app.message}"
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                          <span>Applied to {teamObj?.category || "Project"}</span>
                          {teamId && (
                            <Link to={`/team-hunt/${teamId}`} className="text-primary font-semibold hover:underline flex items-center gap-1">
                              Team page <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>

                        {/* Crucial requirement: surface Second Chance inline if rejected */}
                        {isRejected && teamId && (
                          <SecondChanceBanner teamId={teamId} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>
          <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
            <Link to="/team-hunt" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1">
              Explore more teams looking for applicants <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Skill Gap Advisor Trending Summary Widget (Dismissible / Collapsible, not intrusive) */}
      {!dismissedSkillGap && trendingSkills.length > 0 && (
        <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 via-background to-purple-500/5 shadow-sm transition-all duration-300">
          <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between border-b border-indigo-500/10">
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowSkillGap(!showSkillGap)}>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  Skill Gap Advisor: Trending Insights
                  <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                    {trendingSkills.length} Tracked
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Based on your recent team applications and profile match scores.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSkillGap(!showSkillGap)}
                title={showSkillGap ? "Collapse" : "Expand"}
              >
                {showSkillGap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => setDismissedSkillGap(true)}
                title="Dismiss widget"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Dismiss
              </Button>
            </div>
          </CardHeader>

          {showSkillGap && (
            <CardContent className="p-4 animate-in fade-in-50 duration-200">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {trendingSkills.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-background border border-indigo-500/20 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          {item.skill}
                        </span>
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          In demand
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Identified across <strong className="text-foreground">{item.count}</strong> of your team interactions ({item.percentage}%).
                      </p>
                    </div>
                    {item.resources && item.resources.length > 0 ? (
                      <div className="pt-2 border-t border-border/40">
                        <a 
                          href={item.resources[0].url || "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between group"
                        >
                          <span className="truncate pr-1">Learn: {item.resources[0].title}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground italic">
                        Recommended resource arriving soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};
