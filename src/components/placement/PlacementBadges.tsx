import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock } from "lucide-react";

interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

const BADGE_CATALOG = [
  { id: 'DSA_50', title: 'Code Warrior', description: 'Solve 50 DSA problems', icon: '⚔️' },
  { id: 'MOCK_5', title: 'Interview Veteran', description: 'Complete 5 Mock Interviews', icon: '👔' },
  { id: 'STREAK_14', title: 'Consistency King', description: 'Maintain a 14-day streak', icon: '🔥' },
  { id: 'HR_100', title: 'Smooth Talker', description: 'Review 100 HR tips', icon: '💬' }
];

export const PlacementBadges = () => {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/placement-gamification/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEarned(data.earnedBadges || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Award className="h-5 w-5 text-primary" />
          Achievement Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGE_CATALOG.map(b => {
            const isEarned = earned.find(e => e.badgeId === b.id);
            return (
              <div 
                key={b.id} 
                className={`flex flex-col items-center justify-center p-4 rounded-xl border ${isEarned ? 'border-primary/50 bg-primary/10 shadow-sm' : 'border-dashed bg-muted/30 opacity-60'}`}
              >
                <div className="text-4xl mb-2">{isEarned ? b.icon : <Lock className="h-8 w-8 text-muted-foreground" />}</div>
                <h4 className="font-bold text-sm text-center leading-tight mb-1">{b.title}</h4>
                <p className="text-xs text-center text-muted-foreground">{b.description}</p>
                {isEarned && (
                  <Badge variant="default" className="mt-2 text-[10px] px-1.5 py-0">
                    Earned
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
