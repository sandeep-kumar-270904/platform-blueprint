import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, Award, Flame, Zap, Crown, TrendingUp } from "lucide-react";

const mockUserStats = {
  level: 12,
  xp: 2450,
  nextLevelXp: 3000,
  streak: 7,
  totalPoints: 8750,
  rank: 42,
  badges: 15
};

const mockBadges = [];

const mockLeaderboard = [];

const mockChallenges = [];

const Gamification = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const progressPercent = (mockUserStats.xp / mockUserStats.nextLevelXp) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Trophy className="mr-1 h-3 w-3" />
                  Achievements & Rewards
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Level Up Your{" "}
                  <span className="text-foreground display-font">
                    Learning Journey
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Earn points, unlock badges, and compete with peers while you learn and grow.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        {/* User Stats Overview */}
        <ScrollReveal>
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold">{mockUserStats.level}</p>
                <Progress value={progressPercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {mockUserStats.xp} / {mockUserStats.nextLevelXp} XP
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <Flame className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-3xl font-bold">{mockUserStats.streak} Days</p>
                <p className="text-xs text-muted-foreground mt-3">Keep it going! 🔥</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Points</span>
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold">{mockUserStats.totalPoints}</p>
                <p className="text-xs text-muted-foreground mt-3">All-time earnings</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Rank</span>
                  <Crown className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold">#{mockUserStats.rank}</p>
                <p className="text-xs text-muted-foreground mt-3">Global ranking</p>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="overview">Challenges</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ScrollReveal>
              <h2 className="text-2xl font-bold mb-6 text-center">Active Challenges</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {mockChallenges.map((challenge, index) => (
                  <ScrollReveal key={challenge.id} delay={0.1 * (index + 1)}>
                    <Card className="hover-lift">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{challenge.type}</Badge>
                          <Badge variant="default" className="gap-1">
                            <Zap className="h-3 w-3" />
                            +{challenge.reward} XP
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold">{challenge.title}</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Progress value={(challenge.progress / challenge.total) * 100} />
                          <p className="text-sm text-muted-foreground">
                            {challenge.progress} / {challenge.total} completed
                          </p>
                          <Button className="w-full" size="sm">Continue</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <ScrollReveal>
              <h2 className="text-2xl font-bold mb-6 text-center">Your Achievements</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {mockBadges.map((badge, index) => (
                  <ScrollReveal key={badge.id} delay={0.1 * (index + 1)}>
                    <Card className={`hover-scale ${!badge.earned && 'opacity-60'}`}>
                      <CardContent className="pt-6 text-center">
                        <div className="text-6xl mb-4">{badge.icon}</div>
                        <h3 className="text-lg font-bold mb-2">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                        <Badge variant={badge.earned ? "default" : "secondary"}>
                          {badge.rarity}
                        </Badge>
                        {!badge.earned && (
                          <div className="mt-3">
                            <Badge variant="outline">Locked</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <ScrollReveal>
              <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Top Performers
              </h2>
              <div className="max-w-2xl mx-auto space-y-3">
                {mockLeaderboard.map((user, index) => (
                  <ScrollReveal key={user.rank} delay={0.1 * (index + 1)}>
                    <Card className="hover-lift">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold ${user.rank <= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                            #{user.rank}
                          </div>
                          <div className="text-4xl">{user.avatar}</div>
                          <div className="flex-1">
                            <h3 className="font-bold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">Level {user.level}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{user.points}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                          {user.rank === 1 && <Crown className="h-6 w-6 text-warning" />}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gamification;