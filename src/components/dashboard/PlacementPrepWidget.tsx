import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Target, Code, Video, Briefcase, ChevronRight, Award, Calendar } from "lucide-react";

export const PlacementPrepWidget = () => {
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/placement-summary`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.error) {
            setError(true);
          } else {
            setResponseData(json.data);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <Card className="h-full border-border bg-card animate-pulse">
        <CardContent className="p-6 h-48 flex items-center justify-center text-muted-foreground">
          Loading Placement Sync...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-border bg-card border-dashed">
        <CardContent className="p-6 h-48 flex flex-col items-center justify-center text-muted-foreground">
          <Target className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Placement Prep Data Temporarily Unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const data = responseData;

  if (!data || data.status === 'not_started') {
    return (
      <Card className="h-full border-border bg-card overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Target className="w-24 h-24 text-primary" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Placement Preparation
          </CardTitle>
          <CardDescription>Get ready for your dream job.</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          <p className="text-sm text-muted-foreground">
            Start your personalized placement journey. Master DSA, practice mock interviews, and get company-specific insights.
          </p>
          <Button asChild className="w-full justify-between">
            <Link to="/placement">
              Start Prepping <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate Streak
  let currentStreak = 0;
  if (data.history && data.history.length > 0) {
    const localDays = data.history.map((d: string) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const uniqueDays = Array.from(new Set(localDays)).sort();
    
    let tempStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1] as string);
      const curr = new Date(uniqueDays[i] as string);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) tempStreak++;
      else tempStreak = 1;
    }
    
    const lastDay = new Date(uniqueDays[uniqueDays.length - 1] as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDay.setHours(0, 0, 0, 0);
    
    const diffToday = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffToday <= 1) currentStreak = tempStreak;
  }

  return (
    <Card className="h-full border-border bg-card flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Placement Prep
            </CardTitle>
            <CardDescription>Your readiness overview</CardDescription>
          </div>
          {data.gamification && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
              <Award className="w-3 h-3" /> {data.gamification.levelTitle}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-5">
        
        {/* Readiness & Streak */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground font-medium">Overall Readiness</span>
              <span className="font-bold text-primary">{data.readinessScore}%</span>
            </div>
            <Progress value={data.readinessScore} className="h-2" />
          </div>
          <div className="text-center px-3 border-l">
            <div className="text-2xl font-bold text-orange-500 leading-none">{currentStreak}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Day Streak</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-500/10 rounded-lg p-2 text-center">
            <Code className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <div className="font-bold text-sm">{data.stats?.dsaSolved || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">DSA</div>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-2 text-center">
            <Briefcase className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <div className="font-bold text-sm">{data.stats?.companiesReviewed || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Targets</div>
          </div>
          <div className="bg-pink-500/10 rounded-lg p-2 text-center">
            <Video className="w-4 h-4 mx-auto mb-1 text-pink-500" />
            <div className="font-bold text-sm">{data.stats?.mocksCompleted || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Mocks</div>
          </div>
        </div>

        {/* Next Event */}
        {data.nextEvent ? (
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-background p-2 rounded shadow-sm">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Up Next</p>
              <p className="text-sm font-semibold truncate">{data.nextEvent.title}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium">
                {new Date(data.nextEvent.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(data.nextEvent.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-lg p-3 text-center text-xs text-muted-foreground">
            No upcoming sessions. Book a mock interview!
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button asChild className="w-full justify-between" variant="default">
            <Link to="/placement">
              Continue Prep <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
