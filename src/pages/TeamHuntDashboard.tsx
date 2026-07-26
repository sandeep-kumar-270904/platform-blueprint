import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatToTimezone } from "@/utils/calendarUtils";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyTeams, useMyApplications, useMyInvites, useRespondToInvite } from "@/hooks/useTeams";
import { Loader2, ArrowLeft, Users, Mail, Check, X, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function TeamHuntDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: teamsData, isLoading: teamsLoading } = useMyTeams();
  const { data: appsData, isLoading: appsLoading } = useMyApplications();
  const { data: invitesData, isLoading: invitesLoading } = useMyInvites();
  const { mutate: respondInvite, isPending: respondingInvite } = useRespondToInvite();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const handleInviteResponse = (inviteId: string, status: 'accepted' | 'declined') => {
    setActingOn(inviteId);
    respondInvite({ inviteId, status }, {
      onSuccess: () => {
        toast.success(`Invite ${status}`);
        setActingOn(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || `Failed to ${status} invite`);
        setActingOn(null);
      }
    });
  };

  const isLoading = teamsLoading || appsLoading || invitesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/team-hunt')} className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Team Dashboard</h1>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="my-teams" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="my-teams">
                <Users className="mr-2 h-4 w-4" />
                My Teams
              </TabsTrigger>
              <TabsTrigger value="applications">
                <ClipboardList className="mr-2 h-4 w-4" />
                Applications ({appsData?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="invites">
                <Mail className="mr-2 h-4 w-4" />
                Invites {invitesData?.length ? `(${invitesData.length})` : ''}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-teams" className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Teams I Created</h2>
                {!teamsData?.created || teamsData.created.length === 0 ? (
                  <p className="text-muted-foreground">You haven't created any teams yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {teamsData.created.map((team: any) => (
                      <Card key={team._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/team-hunt/${team._id}/manage`)}>
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={team.status === 'open' ? 'default' : team.status === 'completed' ? 'secondary' : 'outline'}>{team.status.toUpperCase()}</Badge>
                            <span className="text-xs text-muted-foreground">{team.teamSize.current}/{team.teamSize.max} members</span>
                          </div>
                          <CardTitle className="text-lg">{team.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{team.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Teams I Joined</h2>
                {!teamsData?.joined || teamsData.joined.length === 0 ? (
                  <p className="text-muted-foreground">You haven't joined any teams yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {teamsData.joined.map((team: any) => (
                      <Card key={team._id}>
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={team.status === 'open' ? 'default' : team.status === 'completed' ? 'secondary' : 'outline'}>{team.status.toUpperCase()}</Badge>
                            <span className="text-xs text-muted-foreground">{team.teamSize.current}/{team.teamSize.max} members</span>
                          </div>
                          <CardTitle className="text-lg">{team.title}</CardTitle>
                          <CardDescription>Creator: {team.creator.username || 'Unknown'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {team.status === 'completed' && (
                            <Button className="w-full" variant="outline" onClick={() => navigate(`/team-hunt/${team._id}`)}>
                              Leave Reviews
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="applications">
              {!appsData || appsData.length === 0 ? (
                <p className="text-muted-foreground">You haven't applied to any teams yet.</p>
              ) : (
                <div className="grid gap-4">
                  {appsData.map((app: any) => (
                    <Card key={app._id}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg mb-1">{app.team?.title || 'Unknown Team'}</CardTitle>
                          <CardDescription>Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })} ({formatToTimezone(app.appliedAt, undefined, i18n.language)})</CardDescription>
                        </div>
                        <Badge 
                          variant={app.status === 'pending' ? 'secondary' : app.status === 'accepted' ? 'default' : 'destructive'}
                          className={app.status === 'accepted' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{app.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invites">
              {!invitesData || invitesData.length === 0 ? (
                <p className="text-muted-foreground">You have no pending invites.</p>
              ) : (
                <div className="grid gap-4">
                  {invitesData.map((invite: any) => (
                    <Card key={invite._id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg mb-1">{invite.team?.title || 'Unknown Team'}</CardTitle>
                            <CardDescription>
                              Invited by @{invite.invitedBy?.username || 'Unknown'} • {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })} ({formatToTimezone(invite.createdAt, undefined, i18n.language)})
                            </CardDescription>
                          </div>
                          <Badge variant="outline">{invite.team?.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex justify-end gap-3">
                        <Button 
                          variant="outline" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleInviteResponse(invite._id, 'declined')}
                          disabled={respondingInvite}
                        >
                          {actingOn === invite._id && respondingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                          Decline
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleInviteResponse(invite._id, 'accepted')}
                          disabled={respondingInvite}
                        >
                          {actingOn === invite._id && respondingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Accept Invite
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
