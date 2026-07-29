import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { GraduationCap, Target, Layers, Users, MessageSquare, Video, CalendarCheck, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const LearningProgress = () => {
  
  const { summary, loading } = useLearningProgress();
  const { user } = useAuth();


  const tiles = [
    { label: "Quiz Attempts", value: summary.quizAttempts, icon: Target, color: "text-orange-500" },
    { label: "Avg Score", value: `${summary.avgQuizScore}%`, icon: Trophy, color: "text-yellow-500" },
    { label: "Study Minutes", value: summary.totalQuizMinutes, icon: GraduationCap, color: "text-blue-500" },
    { label: "Roadmap Steps", value: summary.roadmapStepsDone, icon: Layers, color: "text-purple-500" },
    { label: "Groups", value: summary.studyGroups, icon: Users, color: "text-green-500" },
    { label: "Messages", value: summary.groupMessagesSent, icon: MessageSquare, color: "text-sky-500" },
    { label: "Classrooms", value: summary.classroomsJoined, icon: Video, color: "text-indigo-500" },
    { label: "Events Attended", value: summary.eventsAttended, icon: CalendarCheck, color: "text-emerald-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-4 w-4 text-primary" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading your stats...</p>
        ) : (
          <>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.label}</span>
                  </div>
                  <div className="text-lg font-bold">{t.value}</div>
                </div>
              ))}
            </div>

            {/* Gamification Badges */}
            {user?.gamification_badges && user.gamification_badges.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1"><Trophy className="h-3 w-3 text-yellow-500"/> Earned Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {user.gamification_badges.map((badge: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center bg-muted/20 border rounded-lg p-2 min-w-[80px] text-center" title={badge.description}>
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <span className="text-[10px] font-bold line-clamp-1">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Quiz mastery</span>
                  <span className="font-medium">{summary.avgQuizScore}% avg · best {summary.bestQuizScore}%</span>
                </div>
                <Progress value={summary.avgQuizScore} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Engagement (groups + classrooms)</span>
                  <span className="font-medium">{summary.studyGroups + summary.classroomsJoined}</span>
                </div>
                <Progress value={Math.min((summary.studyGroups + summary.classroomsJoined) * 10, 100)} className="h-2" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Recent quizzes</h4>
              {summary.recentQuizzes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No quiz attempts yet.</p>
              ) : (
                <div className="space-y-2">
                  {summary.recentQuizzes.map((q) => {
                    const pct = q.total ? Math.round((q.score / q.total) * 100) : 0;
                    return (
                      <div key={q.id} className="flex items-center justify-between text-xs rounded border p-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={pct >= 70 ? "default" : "secondary"} className="text-[10px]">{pct}%</Badge>
                          <span>{q.score}/{q.total}</span>
                        </div>
                        <span className="text-muted-foreground">{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
