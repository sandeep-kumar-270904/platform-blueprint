import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap } from "lucide-react";

interface Profile {
  xp: number;
  levelTitle: string;
}

const LEVELS = [
  { threshold: 0, title: 'Rookie' },
  { threshold: 100, title: 'Novice' },
  { threshold: 500, title: 'Apprentice' },
  { threshold: 1000, title: 'Contender' },
  { threshold: 2500, title: 'Challenger' },
  { threshold: 5000, title: 'Expert' },
  { threshold: 10000, title: 'Placement Pro' },
];

export const PlacementGamificationWidget = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchProfile();
    
    const handleUpdate = () => {
      fetchProfile();
    };
    window.addEventListener('placement-xp-updated', handleUpdate);
    return () => window.removeEventListener('placement-xp-updated', handleUpdate);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/placement-gamification/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return null;

  let currentLevelIdx = LEVELS.findIndex(l => l.title === profile.levelTitle);
  if (currentLevelIdx === -1) currentLevelIdx = 0;
  
  const nextLevel = LEVELS[currentLevelIdx + 1] || LEVELS[LEVELS.length - 1];
  const currentLevel = LEVELS[currentLevelIdx];
  
  const progressPercent = nextLevel.threshold === currentLevel.threshold 
    ? 100 
    : ((profile.xp - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100;

  return (
    <Card className="mb-8 border border-primary/20 bg-primary/5 shadow-md">
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {profile.levelTitle}
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              {profile.xp} Total XP
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to {nextLevel.title}</span>
            <span className="font-medium">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" aria-label={`Progress to ${nextLevel.title}`}>
            <span className="sr-only">{Math.min(progressPercent, 100).toFixed(0)}% complete</span>
          </Progress>
          <p className="text-xs text-right text-muted-foreground">
            {nextLevel.threshold - profile.xp > 0 ? `${nextLevel.threshold - profile.xp} XP to go` : 'Max Level!'}
          </p>
        </div>

      </CardContent>
    </Card>
  );
};
