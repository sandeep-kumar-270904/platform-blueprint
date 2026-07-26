import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTeamLeaderboard, useUserLeaderboard } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star, Users, Briefcase, Medal as MedalIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

export default function TeamHuntLeaderboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [institution, setInstitution] = useState<string>("all");
  
  const { data: teamLeaderboard, isLoading: loadingTeams } = useTeamLeaderboard(institution);
  const { data: userLeaderboard, isLoading: loadingUsers } = useUserLeaderboard(institution);

  // Helper to safely get the first letter
  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "?";

  return (
    <div className="container py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {t("Hall of Fame")}
          </h1>
          <p className="text-muted-foreground mt-1">Discover top teams and outstanding contributors</p>
        </div>
        
        {user?.institutionId && (
          <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">Scope:</span>
            <Select value={institution} onValueChange={setInstitution}>
              <SelectTrigger className="w-[180px] h-8 border-0 bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Filter by Institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Global (All)</SelectItem>
                <SelectItem value={user.institutionId}>My Institution</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="teams" className="text-base h-full">Top Teams</TabsTrigger>
          <TabsTrigger value="users" className="text-base h-full">Top Contributors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="teams">
          <Card className="border-t-4 border-t-primary shadow-md">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Rankings
              </CardTitle>
              <CardDescription>Teams that successfully completed their projects</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTeams ? (
                <div className="p-12 text-center text-muted-foreground">Loading leaderboard...</div>
              ) : !teamLeaderboard || teamLeaderboard.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No completed teams yet. Form a team and be the first!</div>
              ) : (
                <div className="divide-y">
                  {teamLeaderboard.map((team: any, index: number) => (
                    <div key={team._id} className="flex items-center p-4 sm:px-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-12 flex-shrink-0">
                        {index === 0 && <MedalIcon className="h-8 w-8 text-yellow-500" />}
                        {index === 1 && <MedalIcon className="h-8 w-8 text-slate-400" />}
                        {index === 2 && <MedalIcon className="h-8 w-8 text-amber-700" />}
                        {index > 2 && <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>}
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <Link to={`/team-hunt/${team._id}`} className="font-semibold text-lg hover:underline decoration-primary underline-offset-2">
                          {team.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {team.category}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            Led by {team.creator?.username || "Unknown"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-black text-primary">
                          {team.score}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Score
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card className="border-t-4 border-t-blue-500 shadow-md">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-500 fill-blue-500" />
                Contributor Rankings
              </CardTitle>
              <CardDescription>Individuals who have contributed to the most completed projects</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-12 text-center text-muted-foreground">Loading contributors...</div>
              ) : !userLeaderboard || userLeaderboard.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No contributors found. Join a team and complete a project!</div>
              ) : (
                <div className="divide-y">
                  {userLeaderboard.map((u: any, index: number) => (
                    <div key={u._id} className="flex items-center p-4 sm:px-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-12 flex-shrink-0">
                        {index === 0 && <MedalIcon className="h-8 w-8 text-yellow-500" />}
                        {index === 1 && <MedalIcon className="h-8 w-8 text-slate-400" />}
                        {index === 2 && <MedalIcon className="h-8 w-8 text-amber-700" />}
                        {index > 2 && <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>}
                      </div>
                      
                      <Avatar className="h-12 w-12 ml-2 ring-2 ring-background border shadow-sm">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback>{getInitials(u.full_name || u.username)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-lg">{u.full_name || u.username || "Anonymous"}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {u.completedProjects} Projects Completed
                          </span>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-black text-blue-500">
                          {u.score}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          Impact
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
