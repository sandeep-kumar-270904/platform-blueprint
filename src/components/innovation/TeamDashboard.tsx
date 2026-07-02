import { useState, useEffect } from "react";
import { Users, Lightbulb, CheckSquare, MessageSquare, TrendingUp, Calendar, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamChat } from "./TeamChat";
import { TaskBoard } from "./TaskBoard";
import { PresenceIndicator } from "./PresenceIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  profile?: {
    username: string;
    avatar_url: string;
  };
}

interface Team {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  created_at: string;
  members?: TeamMember[];
}

interface TeamDashboardProps {
  teamId: string;
}

const roleColors: Record<string, string> = {
  founder: "bg-primary text-primary-foreground",
  co_founder: "bg-primary/80 text-primary-foreground",
  designer: "bg-accent text-accent-foreground",
  developer: "bg-success text-success-foreground",
  marketer: "bg-warning text-warning-foreground",
  analyst: "bg-muted text-muted-foreground",
  researcher: "bg-secondary text-secondary-foreground",
};

export const TeamDashboard = ({ teamId }: TeamDashboardProps) => {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    ideas: 0,
    tasks: 0,
    completedTasks: 0,
    messages: 0,
  });

  useEffect(() => {
    if (!teamId) return;

    const fetchTeamData = async () => {
      // Fetch team
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      if (teamData) {
        setTeam(teamData);
      }

      // Fetch members
      const { data: membersData } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);

      if (membersData) {
        setMembers(membersData as TeamMember[]);
      }

      // Fetch stats
      const [ideasResult, tasksResult, messagesResult] = await Promise.all([
        supabase.from("ideas").select("id", { count: "exact" }).eq("team_id", teamId),
        supabase.from("tasks").select("id, status").eq("team_id", teamId),
        supabase.from("team_messages").select("id", { count: "exact" }).eq("team_id", teamId),
      ]);

      const completedTasks = tasksResult.data?.filter((t) => t.status === "done").length || 0;

      setStats({
        ideas: ideasResult.count || 0,
        tasks: tasksResult.data?.length || 0,
        completedTasks,
        messages: messagesResult.count || 0,
      });
    };

    fetchTeamData();
  }, [teamId]);

  if (!team) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const taskProgress = stats.tasks > 0 ? (stats.completedTasks / stats.tasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold text-white">
                {team.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{team.name}</h2>
                <p className="text-muted-foreground">{team.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <PresenceIndicator channelName={`team-${teamId}`} />
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Lightbulb className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ideas}</p>
                  <p className="text-xs text-muted-foreground">Ideas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckSquare className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.completedTasks}/{stats.tasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <MessageSquare className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.messages}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Project Progress</p>
            <p className="text-sm text-muted-foreground">{Math.round(taskProgress)}%</p>
          </div>
          <Progress value={taskProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskBoard teamId={teamId} />
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <TeamChat teamId={teamId} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {members.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile?.avatar_url || ""} />
                        <AvatarFallback>
                          {member.profile?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profile?.username || "Anonymous"}
                        </p>
                        <Badge
                          className={`text-xs ${
                            roleColors[member.role] || "bg-muted"
                          }`}
                        >
                          {member.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Object.entries(member.permissions || {})
                        .filter(([_, v]) => v)
                        .slice(0, 2)
                        .map(([k]) => (
                          <Badge key={k} variant="outline" className="text-xs">
                            {k.replace("_", " ")}
                          </Badge>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
