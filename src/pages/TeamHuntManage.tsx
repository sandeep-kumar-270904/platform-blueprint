import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatToTimezone } from "@/utils/calendarUtils";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Users, Check, X, Mail, Flag, Trash2, UserMinus } from "lucide-react";
import { 
  useTeam, 
  useTeamApplicants, 
  useUpdateApplicationStatus, 
  useCompleteTeam, 
  useDisbandTeam, 
  useRemoveMember,
  useTeamAnalytics,
  type Application 
} from "@/hooks/useTeams";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function TeamHuntManage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(id || "");
  const { data: applicants, isLoading: appsLoading } = useTeamApplicants(id || "");
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateApplicationStatus();
  const { mutate: completeTeam, isPending: isCompleting } = useCompleteTeam();
  const { mutate: disbandTeam, isPending: isDisbanding } = useDisbandTeam();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember();
  
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [disbandReason, setDisbandReason] = useState("");
  const [disbandOpen, setDisbandOpen] = useState(false);

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
          <p className="text-muted-foreground mb-6">This team may have been deleted or you don't have access.</p>
          <Button onClick={() => navigate('/team-hunt')}>Back to Team Hunt</Button>
        </div>
      </div>
    );
  }

  const handleAction = (applicationId: string, status: 'accepted' | 'rejected') => {
    setActingOn(applicationId);
    updateStatus({ teamId: team._id, applicationId, status }, {
      onSuccess: () => {
        toast.success(`Application ${status} successfully.`);
        setActingOn(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || `Failed to ${status} application`);
        setActingOn(null);
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setActingOn(userId);
    removeMember({ teamId: team._id, userId }, {
      onSuccess: () => {
        toast.success("Member removed successfully.");
        setActingOn(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to remove member");
        setActingOn(null);
      }
    });
  };

  const handleComplete = () => {
    if (!confirm("Are you sure you want to mark this team's project as completed? This will lock the team and allow members to review each other.")) return;
    completeTeam(team._id, {
      onSuccess: () => {
        toast.success("Team marked as completed!");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to complete team");
      }
    });
  };

  const handleDisband = () => {
    if (!disbandReason.trim()) {
      toast.error("Please provide a reason for disbanding.");
      return;
    }
    disbandTeam({ teamId: team._id, reason: disbandReason }, {
      onSuccess: () => {
        toast.success("Team disbanded.");
        setDisbandOpen(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to disband team");
      }
    });
  };

  const isFull = team.teamSize.current >= team.teamSize.max;
  const isTeamActive = team.status === 'open' || team.status === 'full';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/team-hunt')} className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Team Info */}
          <div className="w-full md:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">{team.category}</Badge>
                  <Badge variant={team.status === 'open' ? 'default' : team.status === 'completed' ? 'secondary' : 'destructive'}>
                    {team.status.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{team.title}</CardTitle>
                <CardDescription>Created {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })} ({formatToTimezone(team.createdAt, undefined, i18n.language)})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Team Size</span>
                    <span className="text-muted-foreground">{team.teamSize.current} / {team.teamSize.max} Filled</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(team.teamSize.current / team.teamSize.max) * 100}%` }}
                    />
                  </div>
                  {isFull && isTeamActive && <p className="text-xs text-destructive mt-2">Team is currently full.</p>}
                </div>
                
                {isTeamActive && (
                  <InviteMemberDialog teamId={team._id} />
                )}
              </CardContent>
              {isTeamActive && (
                <CardFooter className="flex flex-col gap-2 border-t pt-4">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleComplete}
                    disabled={isCompleting || isDisbanding}
                  >
                    {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
                    Mark Project Completed
                  </Button>
                  
                  <Dialog open={disbandOpen} onOpenChange={setDisbandOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Disband Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Disband Team</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to disband this team? This action cannot be undone. 
                          All accepted members will be notified.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input 
                          placeholder="Reason for disbanding..."
                          value={disbandReason}
                          onChange={(e) => setDisbandReason(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDisbandOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDisband} disabled={isDisbanding}>
                          {isDisbanding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Disband
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Main Content / Applicants List */}
          <div className="w-full md:w-2/3">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Members & Applicants
              {applicants && applicants.length > 0 && (
                <Badge variant="secondary" className="ml-2">{applicants.length}</Badge>
              )}
            </h2>

            {appsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !applicants || applicants.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">No applicants yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    When users apply to join your team, their applications will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applicants.map((app: Application) => (
                  <Card key={app._id} className={app.status === 'accepted' ? 'border-green-500/50 bg-green-500/5' : ''}>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={app.applicant.avatar} />
                          <AvatarFallback>{app.applicant.full_name?.charAt(0) || app.applicant.username?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{app.applicant.full_name || app.applicant.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {app.status === 'accepted' ? 'Joined ' : 'Applied '}
                            {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={app.status === 'pending' ? 'secondary' : app.status === 'accepted' ? 'default' : 'destructive'}
                          className={app.status === 'accepted' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                        {app.status === 'accepted' && isTeamActive && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(app.applicant._id)}
                            disabled={isRemoving && actingOn === app.applicant._id}
                          >
                            {(isRemoving && actingOn === app.applicant._id) ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <UserMinus className="h-3 w-3 mr-1" />}
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    {/* Only show message and skills if pending, or if they existed and we want to show them */}
                    {(app.status === 'pending' || app.message) && (
                      <CardContent className="space-y-4">
                        {app.message && (
                          <div className="bg-muted/50 p-4 rounded-lg text-sm">
                            <span className="font-semibold block mb-1">Message:</span>
                            <p className="whitespace-pre-wrap">{app.message}</p>
                          </div>
                        )}
                        
                        {app.skillsOffered?.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground block mb-2">Offered Skills:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {app.skillsOffered.map((s, i) => <Badge key={i} variant="outline" className="bg-background">{s}</Badge>)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                    
                    {app.status === 'pending' && isTeamActive && (
                      <CardFooter className="pt-2 gap-3 justify-end bg-muted/10 rounded-b-xl border-t mt-4 pb-4">
                        <Button 
                          variant="outline" 
                          className="text-destructive hover:bg-destructive/10" 
                          onClick={() => handleAction(app._id, 'rejected')}
                          disabled={isUpdating || isFull}
                        >
                          {actingOn === app._id && isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                          Decline
                        </Button>
                        <Button 
                          onClick={() => handleAction(app._id, 'accepted')}
                          disabled={isUpdating || isFull}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {actingOn === app._id && isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Accept Application
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


function TeamInsightsPanel({ teamId }: { teamId: string }) {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = useTeamAnalytics(teamId);

  if (isLoading) return null;
  if (!analytics) return null;

  return (
    <Card className="mt-6 border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Users className="h-4 w-4" />
          {t('Team Insights')}
        </CardTitle>
        <CardDescription className="text-xs">Real-time metrics for your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Views</span>
          <span className="font-semibold">{analytics.views || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Applications</span>
          <span className="font-semibold">{analytics.totalApplications || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Acceptance Rate</span>
          <span className="font-semibold">{analytics.acceptanceRate || 0}%</span>
        </div>
        {analytics.matchScoreDistribution && (
          <div className="pt-2 border-t">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">Match Score Distribution</span>
            <div className="grid grid-cols-3 gap-1 text-center text-xs">
              <div className="bg-green-500/10 p-1 rounded border border-green-500/20">
                <span className="block font-bold text-green-600">{analytics.matchScoreDistribution.high || 0}</span>
                <span className="text-[10px] text-muted-foreground">&ge;70%</span>
              </div>
              <div className="bg-yellow-500/10 p-1 rounded border border-yellow-500/20">
                <span className="block font-bold text-yellow-600">{analytics.matchScoreDistribution.medium || 0}</span>
                <span className="text-[10px] text-muted-foreground">40-69%</span>
              </div>
              <div className="bg-red-500/10 p-1 rounded border border-red-500/20">
                <span className="block font-bold text-red-600">{analytics.matchScoreDistribution.low || 0}</span>
                <span className="text-[10px] text-muted-foreground">&lt;40%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
