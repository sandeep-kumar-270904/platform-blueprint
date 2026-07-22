import React, { useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { PlacementNotificationBell } from '@/components/placement/PlacementNotificationBell';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ActivityHeatmap } from '@/components/placement/ActivityHeatmap';
import { TargetCompaniesWidget } from '@/components/placement/TargetCompaniesWidget';
import { useProgressDashboard } from '@/hooks/useProgressDashboard';
import { Download, Target, Code, Video, AlertCircle, ArrowRight, Brain, MessageSquare, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlacementGamificationWidget } from '@/components/placement/PlacementGamificationWidget';
import { PlacementBadges } from '@/components/placement/PlacementBadges';
import { PlacementLeaderboard } from '@/components/placement/PlacementLeaderboard';
import { PlacementChallenges } from '@/components/placement/PlacementChallenges';
import { ReferralsDashboardTab } from '@/components/placement/ReferralsDashboardTab';
import { PlacementOnboardingWizard } from '@/components/placement/PlacementOnboardingWizard';
import { PlacementPrepPlanWidget } from '@/components/placement/PlacementPrepPlanWidget';
import { UnifiedSearchBar } from '@/components/placement/UnifiedSearchBar';
import { PlacementDoubtSolvingTab } from '@/components/placement/PlacementDoubtSolvingTab';
import { PlacementScheduleTab } from '@/components/placement/PlacementScheduleTab';
import { usePlacementOnboarding } from '@/hooks/usePlacementOnboarding';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

export default function PlacementDashboard() {
  const { data: progress, isLoading, isError } = useProgressDashboard();
  const { data: onboardingData, isLoading: isOnboardingLoading } = usePlacementOnboarding();
  const queryClient = useQueryClient();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (onboardingData && !onboardingData.has_completed) {
      setShowWizard(true);
    }
  }, [onboardingData]);

  const handleWizardComplete = () => {
    setShowWizard(false);
    queryClient.invalidateQueries({ queryKey: ['placementOnboarding'] });
  };

  const handleExport = async () => {
    if (dashboardRef.current) {
      try {
        const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'My-Placement-Progress.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to export dashboard', err);
      }
    }
  };

  if (isLoading || isOnboardingLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading dashboard...</div>;
  if (isError || !progress) return <div className="min-h-screen bg-background flex items-center justify-center">Failed to load progress</div>;

  // Zero Activity State (Get Started) - Only if onboarding is complete and they STILL haven't done anything
  if (progress.overallReadiness === 0 && progress.history.length === 0 && onboardingData?.has_completed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 mt-16 flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="bg-primary/10 p-6 rounded-full mb-6">
            <Target className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Get Started with Placement Prep</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your dashboard is empty because you haven't started your preparation journey yet. Solve DSA problems, review interview questions, or book mock interviews to see your progress here!
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link to="/placement/dsa">Practice DSA</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/placement/interview-prep">Explore Companies</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate streaks in local timezone
  const calculateStreaks = (rawHistory: string[]) => {
    // Map to local calendar days (YYYY-MM-DD in local time)
    const localDays = rawHistory.map(d => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const uniqueDays = Array.from(new Set(localDays)).sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (uniqueDays.length > 0) {
      let tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        // Difference in local calendar days
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      
      const lastDay = new Date(uniqueDays[uniqueDays.length - 1]);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Local midnight today
      lastDay.setHours(0, 0, 0, 0); // Local midnight last active day
      
      const diffToday = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffToday <= 1) {
        currentStreak = tempStreak;
      }
    }
    
    return { currentStreak, longestStreak, history: uniqueDays };
  };

  const { currentStreak, longestStreak, history } = calculateStreaks(progress.history);
  const focusAreas = progress.focusAreas || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <PlacementOnboardingWizard 
        open={showWizard} 
        onComplete={handleWizardComplete} 
        onSkip={handleWizardComplete} 
      />

      {/* Add the custom bell explicitly near the top since this page has its own context */}
      <div className="fixed top-4 right-20 z-50 mt-1">
        <PlacementNotificationBell />
      </div>

      <main className="container mx-auto px-4 py-8 mt-16 max-w-7xl">
        <PlacementGamificationWidget />
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex overflow-x-auto snap-x md:grid w-full md:max-w-4xl md:grid-cols-6 justify-start scrollbar-hide">
            <TabsTrigger className="shrink-0 snap-start" value="overview">Overview</TabsTrigger>
            <TabsTrigger className="shrink-0 snap-start" value="rewards">Leaderboards & Rewards</TabsTrigger>
            <TabsTrigger className="shrink-0 snap-start" value="doubt">Doubt Solving</TabsTrigger>
            <TabsTrigger className="shrink-0 snap-start" value="schedule">My Schedule</TabsTrigger>
            <TabsTrigger className="shrink-0 snap-start" value="referrals">Referrals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Placement Preparation</h1>
            <p className="text-muted-foreground">Your comprehensive guide to cracking tech interviews.</p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-xl">
            <UnifiedSearchBar />
          </div>
          <Button onClick={handleExport} variant="outline" className="flex gap-2">
            <Download className="w-4 h-4" /> Export Summary
          </Button>
        </div>

        {onboardingData?.has_completed && onboardingData.active_plan && (
          <div className="mb-8">
            <ScrollReveal>
              <PlacementPrepPlanWidget 
                planData={onboardingData.active_plan} 
                onAdjustPlan={() => setShowWizard(true)} 
              />
            </ScrollReveal>
          </div>
        )}

        {/* Exportable Area */}
        <div ref={dashboardRef} className="space-y-6 bg-background p-4 -m-4 rounded-xl">
          
          {/* Top Summary Area */}
          <ScrollReveal>
            <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20">
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Overall Placement Readiness</h2>
                  <p className="text-muted-foreground mb-4">Combines your activity across DSA, Interview Prep, and Mock Interviews based on minimum target thresholds.</p>
                  <div className="flex items-center gap-4">
                    <Progress value={progress.overallReadiness} className="h-4 w-full" />
                    <span className="text-3xl font-extrabold text-primary">{progress.overallReadiness}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Three Individual Progress Cards */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Code className="w-5 h-5 text-blue-500" /> DSA Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{progress.dsaStats.totalSolved} <span className="text-sm font-normal text-muted-foreground">solved</span></div>
                  <div className="flex justify-between text-sm mt-4">
                    <div className="text-green-500 font-medium">Easy: {progress.dsaStats.easy}</div>
                    <div className="text-yellow-500 font-medium">Medium: {progress.dsaStats.medium}</div>
                    <div className="text-red-500 font-medium">Hard: {progress.dsaStats.hard}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-purple-500" /> Interview Prep
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {progress.interviewPrepStats.targetReadiness}% <span className="text-sm font-normal text-muted-foreground">readiness</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    {progress.interviewPrepStats.itemsReviewed} items reviewed across {progress.interviewPrepStats.companiesTargeted} target companies.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="w-5 h-5 text-pink-500" /> Mock Interviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {progress.mockStats.completed} <span className="text-sm font-normal text-muted-foreground">completed</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    {progress.mockStats.upcoming} upcoming sessions scheduled.
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3 lg:col-span-1 bg-gradient-to-r from-background to-blue-50 dark:to-blue-900/10 border-blue-100 dark:border-blue-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-blue-500" /> Aptitude & Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Master Quantitative, Logical, and Verbal concepts for initial screening rounds.
                  </p>
                  <Button variant="outline" className="w-full justify-between border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild>
                    <Link to="/placement/aptitude">
                      Practice Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 lg:col-span-2 bg-gradient-to-r from-background to-indigo-50 dark:to-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> GD & Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Master group discussions with our topics library, self-practice mode, and study group peer sessions.
                  </p>
                  <Button variant="default" className="whitespace-nowrap w-full md:w-auto" asChild>
                    <Link to="/placement/group-discussion">
                      Start Prep <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="md:col-span-3 lg:col-span-2 bg-gradient-to-r from-background to-teal-50 dark:to-teal-900/10 border-teal-100 dark:border-teal-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="w-5 h-5 text-teal-500" /> Doubt Solving
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Stuck on a problem? Ask questions, share snippets, and get help from verified seniors and alumni.
                  </p>
                  <Button variant="default" className="whitespace-nowrap w-full md:w-auto" asChild>
                    <Link to="/placement/doubt-solving">
                      Ask a Senior <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>

          {/* Middle Row: Heatmap & Targets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="targets">
            <ScrollReveal delay={0.2}>
              <ActivityHeatmap 
                history={history} 
                currentStreak={currentStreak}
                longestStreak={longestStreak}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <TargetCompaniesWidget />
            </ScrollReveal>
          </div>
          
        </div>
        {/* End of Exportable Area */}

        {/* Focus Areas Panel */}
        <ScrollReveal delay={0.4}>
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" /> Focus Areas
            </h2>
            {focusAreas.length === 0 ? (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-6 text-center text-green-700 dark:text-green-400">
                  You're doing great! Keep up the consistent progress across all modules.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {focusAreas.map((area, idx) => (
                  <Card key={idx} className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{area.title}</CardTitle>
                      <CardDescription>{area.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {area.link.startsWith('#') ? (
                        <Button variant="secondary" className="w-full justify-between" onClick={() => {
                          document.getElementById(area.link.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                          {area.btnText} <ArrowRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="secondary" className="w-full justify-between" asChild>
                          <Link to={area.link}>
                            {area.btnText} <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
    </TabsContent>

    <TabsContent value="rewards" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PlacementLeaderboard />
        </div>
        <div className="space-y-6">
          <PlacementChallenges />
        </div>
      </div>
      <div className="mt-6">
        <PlacementBadges />
      </div>
    </TabsContent>

    <TabsContent value="doubt" className="mt-6">
      <PlacementDoubtSolvingTab />
    </TabsContent>
    
    <TabsContent value="schedule" className="mt-6">
      <PlacementScheduleTab />
    </TabsContent>

    <TabsContent value="referrals" className="space-y-6 mt-6">
      <ReferralsDashboardTab />
    </TabsContent>
  </Tabs>
</main>
</div>
  );
}
