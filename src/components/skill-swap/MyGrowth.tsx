import { useState } from "react";
import { useMyGoals, useMyStreak, useCreateGoal } from "@/hooks/useSkillSwap";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Flame, Target, Trophy, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

export function MyGrowth() {
  const { data: goals, isLoading: goalsLoading } = useMyGoals();
  const { data: streak, isLoading: streakLoading } = useMyStreak();
  const createGoal = useCreateGoal();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createGoal.mutateAsync({
        goalType: formData.get("goalType") as string,
        target: parseInt(formData.get("target") as string, 10),
        period: formData.get("period") as string,
      });
      toast({ title: "Goal Created Successfully!" });
      setIsCreating(false);
    } catch (err: any) {
      toast({ title: "Failed to create goal", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Streaks Section */}
      <section>
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Flame className="text-orange-500 h-6 w-6" /> My Activity Streaks
        </h3>
        {streakLoading ? <p>Loading streaks...</p> : (
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-orange-500/10 border-orange-200">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <Flame className={`h-10 w-10 mb-2 ${streak?.currentStreak && streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <h4 className="text-3xl font-black">{streak?.currentStreak || 0}</h4>
                <p className="text-sm font-medium text-muted-foreground">Current Week Streak</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <Trophy className="h-10 w-10 text-primary mb-2" />
                <h4 className="text-3xl font-black">{streak?.longestStreak || 0}</h4>
                <p className="text-sm font-medium text-muted-foreground">Longest Streak</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Goals Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Target className="text-blue-500 h-6 w-6" /> Learning Goals
          </h3>
          <Button onClick={() => setIsCreating(!isCreating)} variant="outline">
            {isCreating ? "Cancel" : "Set New Goal"}
          </Button>
        </div>

        {isCreating && (
          <Card className="mb-6 border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <form onSubmit={handleCreateGoal} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">I want to...</label>
                  <select name="goalType" className="w-full h-10 px-3 rounded-md border" required>
                    <option value="sessions-per-month">Complete sessions</option>
                    <option value="skills-to-learn">Learn new skills</option>
                    <option value="skills-to-teach">Offer skills to teach</option>
                  </select>
                </div>
                <div className="w-24 space-y-2">
                  <label className="text-sm font-medium">Target</label>
                  <Input name="target" type="number" min={1} defaultValue={3} required />
                </div>
                <div className="w-32 space-y-2">
                  <label className="text-sm font-medium">Per</label>
                  <select name="period" className="w-full h-10 px-3 rounded-md border" required>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
                <Button type="submit" disabled={createGoal.isPending}>Save</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {goalsLoading ? <p>Loading goals...</p> : goals?.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              You haven't set any active goals yet. Set a goal to track your progress!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals?.map(goal => {
              const percentage = Math.min((goal.progress / goal.target) * 100, 100);
              const formatType = (type: string) => type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <Card key={goal._id} className={goal.status === 'completed' ? 'border-green-200 bg-green-50/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <div className="font-semibold">{formatType(goal.goalType)}</div>
                      <div className="text-sm font-medium">
                        {goal.progress} / {goal.target} {goal.status === 'completed' && <Badge className="ml-2 bg-green-500">Completed!</Badge>}
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" indicatorClassName={goal.status === 'completed' ? "bg-green-500" : "bg-primary"} />
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ends this {goal.period}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
