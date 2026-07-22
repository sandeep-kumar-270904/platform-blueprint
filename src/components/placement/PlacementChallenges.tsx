import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  targetValue: number;
  rewardXp: number;
  currentProgress: number;
  claimed: boolean;
}

export const PlacementChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/placement-gamification/challenges`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setChallenges(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/placement-gamification/challenges/${id}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`+${data.xpAwarded} XP! Reward claimed successfully.`, { icon: '✨' });
        fetchChallenges(); // Refresh
        // Dispatch an event so the GamificationWidget re-fetches its data
        window.dispatchEvent(new Event('placement-xp-updated'));
      } else {
        toast.error(data.message || 'Failed to claim');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    }
  };

  if (challenges.length === 0) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-5 w-5 text-primary" />
          Weekly Challenges
        </CardTitle>
        <CardDescription>Complete these to earn bonus XP this week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {challenges.map(chal => {
          const progressPercent = Math.min((chal.currentProgress / chal.targetValue) * 100, 100);
          const isComplete = chal.currentProgress >= chal.targetValue;

          return (
            <div key={chal.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`font-medium ${chal.claimed ? 'line-through text-muted-foreground' : ''}`}>{chal.title}</h4>
                  <p className="text-xs font-semibold text-yellow-600 flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3" />
                    +{chal.rewardXp} XP
                  </p>
                </div>
                {chal.claimed ? (
                  <div className="flex items-center gap-1 text-sm text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                    <CheckCircle2 className="h-4 w-4" />
                    Claimed
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant={isComplete ? "default" : "secondary"}
                    disabled={!isComplete}
                    onClick={() => handleClaim(chal.id)}
                  >
                    {isComplete ? 'Claim Reward' : `${chal.currentProgress} / ${chal.targetValue}`}
                  </Button>
                )}
              </div>
              <Progress value={progressPercent} className={`h-2 ${chal.claimed ? 'opacity-50' : ''}`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
