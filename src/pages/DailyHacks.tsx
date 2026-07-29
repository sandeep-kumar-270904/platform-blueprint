import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Heart, Share2, Bookmark, TrendingUp, Award } from "lucide-react";

const mockHacks = [];

const mockAchievements = [];

const DailyHacks = () => {
  const [selectedTab, setSelectedTab] = useState("hacks");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Lightbulb className="mr-1 h-3 w-3" />
                  Tips & Achievements
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Daily Hacks &{" "}
                  <span className="text-foreground display-font">
                    Showcase
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Share your daily learnings, celebrate achievements, and inspire the community.
                </p>
                <Button size="lg" className="hover-scale">
                  Share Your Hack
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="hacks">Daily Hacks</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="hacks" className="space-y-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {mockHacks.map((hack, index) => (
                <ScrollReveal key={hack.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold mb-1">{hack.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {hack.user} • {hack.timeAgo}
                          </p>
                        </div>
                        <Badge variant="secondary">{hack.category}</Badge>
                      </div>
                      <p className="text-sm">{hack.content}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Heart className="h-4 w-4" />
                          <span>{hack.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Share2 className="h-4 w-4" />
                          <span>{hack.shares}</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {mockAchievements.map((achievement, index) => (
                <ScrollReveal key={achievement.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">{achievement.badge}</div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{achievement.title}</h3>
                          <p className="text-sm mb-2">{achievement.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.user} • {achievement.timeAgo}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Heart className="h-4 w-4" />
                          <span>{achievement.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DailyHacks;
