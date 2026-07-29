import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Medal, Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompletenessProps {
  resumeId: string;
  onMilestoneUnlocked?: (badge: string) => void;
}

export const ResumeCompleteness: React.FC<CompletenessProps> = ({ resumeId, onMilestoneUnlocked }) => {
  const [score, setScore] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/completeness`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setScore(data.score);
          setMissing(data.missing);
          
          // Check if new badge unlocked locally to trigger celebration callback
          if (data.badges) {
            data.badges.forEach((b: string) => {
              if (!badges.includes(b) && onMilestoneUnlocked) {
                onMilestoneUnlocked(b);
              }
            });
            setBadges(data.badges);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchScore();
    const interval = setInterval(fetchScore, 10000); // refresh every 10s or we can rely on external trigger
    return () => clearInterval(interval);
  }, [resumeId, badges, onMilestoneUnlocked]);

  return (
    <div className="bg-muted/40 p-4 rounded-lg border space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-sm">Profile Completeness</h4>
        <span className="font-bold text-primary text-sm">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
      
      {score < 100 ? (
        <div className="flex flex-wrap gap-2 pt-2">
          {missing.map((m, i) => (
            <Badge key={i} variant="secondary" className="text-xs text-muted-foreground">
              + Add {m}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-green-600 flex items-center gap-1 font-medium pt-2">
          <CheckCircle2 className="h-3 w-3" /> Fully complete! Outstanding job.
        </p>
      )}

      {badges.length > 0 && (
        <div className="pt-3 border-t mt-3">
          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Unlocked Badges</h5>
          <div className="flex gap-2">
            {badges.map((b, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 rounded-full p-2">
                      <Medal className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{b}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
