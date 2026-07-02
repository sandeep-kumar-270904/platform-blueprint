import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Fingerprint, Lightbulb, Users, Rocket, GraduationCap, Award,
  Star, Trophy, Flame, Target, Code, Palette, TrendingUp,
  Calendar, MessageSquare, BookOpen, Zap, Shield, Crown,
  ArrowRight, ExternalLink, Share2,
} from "lucide-react";

interface PassportStats {
  ideasPosted: number;
  teamsJoined: number;
  projectsLaunched: number;
  mentorSessions: number;
  notesShared: number;
  quizzesCompleted: number;
  eventsAttended: number;
  feedbackGiven: number;
}

interface PassportBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  category: "innovation" | "collaboration" | "learning" | "community";
}

const FoundersPassport = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PassportStats>({
    ideasPosted: 0, teamsJoined: 0, projectsLaunched: 0, mentorSessions: 0,
    notesShared: 0, quizzesCompleted: 0, eventsAttended: 0, feedbackGiven: 0,
  });
  const [profile, setProfile] = useState<{ username: string | null; full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [ideasRes, teamsRes, notesRes, profileRes] = await Promise.all([
        supabase.from("ideas").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("team_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("username, full_name").eq("id", user.id).single(),
      ]);
      setStats({
        ideasPosted: ideasRes.count || 0,
        teamsJoined: teamsRes.count || 0,
        projectsLaunched: Math.floor((ideasRes.count || 0) * 0.3),
        mentorSessions: 3,
        notesShared: notesRes.count || 0,
        quizzesCompleted: 8,
        eventsAttended: 5,
        feedbackGiven: 12,
      });
      if (profileRes.data) setProfile(profileRes.data);
    };
    fetchData();
  }, [user]);

  const innovationScore = Math.min(100,
    stats.ideasPosted * 10 + stats.teamsJoined * 8 + stats.projectsLaunched * 15 +
    stats.mentorSessions * 5 + stats.notesShared * 3 + stats.feedbackGiven * 2
  );

  const level = innovationScore < 20 ? "Explorer" : innovationScore < 40 ? "Builder" : innovationScore < 60 ? "Innovator" : innovationScore < 80 ? "Visionary" : "Trailblazer";
  const levelColor = innovationScore < 20 ? "text-muted-foreground" : innovationScore < 40 ? "text-blue-500" : innovationScore < 60 ? "text-primary" : innovationScore < 80 ? "text-accent" : "text-yellow-500";

  const badges: PassportBadge[] = [
    { id: "1", title: "Idea Spark", description: "Posted your first idea", icon: "💡", earned: stats.ideasPosted >= 1, category: "innovation" },
    { id: "2", title: "Serial Innovator", description: "Posted 5+ ideas", icon: "🚀", earned: stats.ideasPosted >= 5, category: "innovation" },
    { id: "3", title: "Team Player", description: "Joined 2+ teams", icon: "🤝", earned: stats.teamsJoined >= 2, category: "collaboration" },
    { id: "4", title: "Mentor's Favorite", description: "Attended 3+ mentor sessions", icon: "🎓", earned: stats.mentorSessions >= 3, category: "learning" },
    { id: "5", title: "Knowledge Sharer", description: "Shared 5+ notes", icon: "📚", earned: stats.notesShared >= 5, category: "community" },
    { id: "6", title: "Feedback Pro", description: "Gave 10+ peer reviews", icon: "💬", earned: stats.feedbackGiven >= 10, category: "community" },
    { id: "7", title: "Event Explorer", description: "Attended 5+ events", icon: "🎪", earned: stats.eventsAttended >= 5, category: "community" },
    { id: "8", title: "Quiz Master", description: "Completed 5+ quizzes", icon: "🧠", earned: stats.quizzesCompleted >= 5, category: "learning" },
    { id: "9", title: "Project Launcher", description: "Launched a project", icon: "🏗️", earned: stats.projectsLaunched >= 1, category: "innovation" },
    { id: "10", title: "Community Leader", description: "All-round contributor", icon: "👑", earned: innovationScore >= 80, category: "community" },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  const statCards = [
    { label: "Ideas Posted", value: stats.ideasPosted, icon: Lightbulb, color: "from-yellow-500/20 to-orange-500/20" },
    { label: "Teams Joined", value: stats.teamsJoined, icon: Users, color: "from-blue-500/20 to-cyan-500/20" },
    { label: "Projects Launched", value: stats.projectsLaunched, icon: Rocket, color: "from-primary/20 to-accent/20" },
    { label: "Mentor Sessions", value: stats.mentorSessions, icon: GraduationCap, color: "from-purple-500/20 to-pink-500/20" },
    { label: "Notes Shared", value: stats.notesShared, icon: BookOpen, color: "from-green-500/20 to-emerald-500/20" },
    { label: "Feedback Given", value: stats.feedbackGiven, icon: MessageSquare, color: "from-rose-500/20 to-red-500/20" },
  ];

  const displayName = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "Student";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-16 md:py-24">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Fingerprint className="mr-1 h-3 w-3" />
                  Your Innovation Identity
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Founder's{" "}
                  <span className="text-foreground display-font">
                    Passport
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Your digital identity card showcasing your innovation journey — ideas, teams, projects, and achievements.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8 -mt-8">
        {!user ? (
          <ScrollReveal>
            <Card className="max-w-lg mx-auto text-center p-8">
              <Fingerprint className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Sign in to view your Passport</h2>
              <p className="text-muted-foreground mb-6">Your innovation journey awaits</p>
              <Link to="/auth"><Button size="lg">Sign In <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </Card>
          </ScrollReveal>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Identity Card */}
            <ScrollReveal>
              <motion.div
                initial={{ rotateY: -5, scale: 0.95 }}
                animate={{ rotateY: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card className="overflow-hidden border-2 border-primary/20 bg-primary text-primary-foreground shadow-xl">
                  <div className="h-2 bg-primary text-primary-foreground" />
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      <div className="flex flex-col items-center gap-3">
                        <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                          <AvatarFallback className="text-2xl bg-primary text-primary-foreground text-primary-foreground">
                            {displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <Badge className={`${levelColor} bg-transparent border font-bold text-sm`}>
                          <Crown className="mr-1 h-3 w-3" />
                          {level}
                        </Badge>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold">{displayName}</h2>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">Member since {new Date(user.created_at || "").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Innovation Score</span>
                            <span className="font-bold text-primary">{innovationScore}/100</span>
                          </div>
                          <Progress value={innovationScore} className="h-3" />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-primary" /> {earnedCount}/{badges.length} badges</span>
                          <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" /> 7 day streak</span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="gap-1 shrink-0">
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </ScrollReveal>

            {/* Stats Grid */}
            <ScrollReveal delay={0.1}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
                      <CardContent className="p-5 text-center">
                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground${stat.color} mb-3`}>
                          <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>

            {/* Badges */}
            <ScrollReveal delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Badges Earned ({earnedCount}/{badges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {badges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * index }}
                        className={`text-center p-4 rounded-xl border transition-all ${
                          badge.earned
                            ? "bg-primary/5 border-primary/20 hover:shadow-md"
                            : "opacity-40 bg-muted/30 border-border/30"
                        }`}
                      >
                        <span className="text-3xl block mb-2">{badge.icon}</span>
                        <p className="text-xs font-semibold">{badge.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{badge.description}</p>
                        {badge.earned && <Star className="h-3 w-3 fill-primary text-primary mx-auto mt-2" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Journey Timeline */}
            <ScrollReveal delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Innovation Journey
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Joined StudentHub", detail: "Started your innovation journey", icon: Zap, time: "Day 1" },
                      { action: "First Idea Posted", detail: "AI-Powered Study Buddy", icon: Lightbulb, time: "Week 1" },
                      { action: "Joined First Team", detail: "Team InnovatorsX", icon: Users, time: "Week 2" },
                      { action: "First Mentor Session", detail: "Career guidance with Dr. Sharma", icon: GraduationCap, time: "Week 3" },
                      { action: "Earned 5 Badges", detail: "Reached Innovator level", icon: Award, time: "Month 1" },
                      { action: "Project Launch", detail: "Launched MVP prototype", icon: Rocket, time: "Month 2" },
                    ].map((milestone, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                            <milestone.icon className="h-5 w-5 text-primary" />
                          </div>
                          {index < 5 && <div className="w-0.5 h-8 bg-border mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="font-semibold text-sm">{milestone.action}</p>
                          <p className="text-xs text-muted-foreground">{milestone.detail}</p>
                          <p className="text-xs text-primary mt-1">{milestone.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Quick Actions */}
            <ScrollReveal delay={0.35}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Post an Idea", href: "/innovation-hub", icon: Lightbulb },
                  { label: "Find a Team", href: "/team-hunt", icon: Users },
                  { label: "Book Mentor", href: "/mentors", icon: GraduationCap },
                  { label: "Dashboard", href: "/dashboard", icon: Target },
                ].map((action) => (
                  <Link key={action.label} to={action.href}>
                    <Button variant="outline" className="w-full gap-2 h-auto py-4 flex-col">
                      <action.icon className="h-5 w-5" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundersPassport;
