import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSyncStatusToast } from "@/hooks/useSyncStatusToast";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, Lightbulb, Users, Bell, Star,
  ArrowRight, Handshake, Radio, User, UserPlus,
  Calendar, Target, GraduationCap, MessageSquare, Briefcase,
  Flame, Award, TrendingUp,
} from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyIdeas } from "@/components/dashboard/MyIdeas";
import { MyCollaborations } from "@/components/dashboard/MyCollaborations";
import { MyTeams } from "@/components/dashboard/MyTeams";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { LiveActivity } from "@/components/dashboard/LiveActivity";
import { ProfileManager } from "@/components/dashboard/ProfileManager";
import { JoinRequestsManager } from "@/components/dashboard/JoinRequestsManager";
import { LearningProgress } from "@/components/dashboard/LearningProgress";

type Section = "overview" | "ideas" | "collaborations" | "requests" | "teams" | "progress" | "notifications" | "live" | "profile" | "links";

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "ideas", label: "My Ideas", icon: Lightbulb },
  { id: "collaborations", label: "Collaborations", icon: Handshake },
  { id: "requests", label: "Join Requests", icon: UserPlus },
  { id: "teams", label: "My Teams", icon: Users },
  { id: "progress", label: "Learning Progress", icon: TrendingUp },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "live", label: "Live Activity", icon: Radio },
  { id: "profile", label: "Profile", icon: User },
  { id: "links", label: "Quick Links", icon: ArrowRight },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [stats, setStats] = useState({
    notesCount: 0, notesViews: 0, notesDownloads: 0,
    notesAvgRating: 0, ideasCount: 0, teamsCount: 0, notificationsCount: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const [notesRes, ideasRes, teamsRes, notifsRes] = await Promise.all([
      supabase.from("notes").select("views, downloads, rating").eq("user_id", user.id),
      supabase.from("ideas").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("team_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    ]);
    const notes = notesRes.data || [];
    const rated = notes.filter(n => Number(n.rating) > 0);
    setStats({
      notesCount: notes.length,
      notesViews: notes.reduce((s, n) => s + (n.views || 0), 0),
      notesDownloads: notes.reduce((s, n) => s + (n.downloads || 0), 0),
      notesAvgRating: rated.length > 0 ? rated.reduce((s, n) => s + Number(n.rating), 0) / rated.length : 0,
      ideasCount: ideasRes.count || 0,
      teamsCount: teamsRes.count || 0,
      notificationsCount: notifsRes.count || 0,
    });
  }, [user]);

  // Realtime subscriptions filtered to current user only — respects RLS scope.
  const syncStatus = useRealtimeSync({
    channelName: user ? `dashboard-stats-${user.id}` : undefined,
    enabled: !!user,
    filters: user
      ? [
          { table: "ideas", filter: `user_id=eq.${user.id}` },
          { table: "notes", filter: `user_id=eq.${user.id}` },
          { table: "team_members", filter: `user_id=eq.${user.id}` },
          { table: "notifications", filter: `user_id=eq.${user.id}` },
        ]
      : [],
    onChange: fetchStats,
    pollIntervalMs: 30000,
  });
  useSyncStatusToast(syncStatus, "Dashboard sync");

  const quickLinks = [
    { title: "Notes Hub", href: "/notes", icon: BookOpen, desc: "Study materials", color: "text-primary" },
    { title: "Innovation Hub", href: "/innovation-hub", icon: Lightbulb, desc: "Ideas & startups", color: "text-yellow-500" },
    { title: "Events", href: "/events", icon: Calendar, desc: "Hackathons", color: "text-accent-foreground" },
    { title: "Jobs Portal", href: "/jobs", icon: Briefcase, desc: "Opportunities", color: "text-green-500" },
    { title: "Study Groups", href: "/study-groups", icon: Users, desc: "Collaborate", color: "text-blue-500" },
    { title: "Mentors", href: "/mentors", icon: GraduationCap, desc: "Book sessions", color: "text-purple-500" },
    { title: "Quiz Hub", href: "/quiz", icon: Target, desc: "Test knowledge", color: "text-orange-500" },
    { title: "Forum", href: "/forum", icon: MessageSquare, desc: "Discuss", color: "text-pink-500" },
    { title: "Passport", href: "/founders-passport", icon: Flame, desc: "Innovation ID", color: "text-orange-500" },
  ];

  const renderSection = () => {
    if (!user) return null;

    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <DashboardOverview stats={stats} />
            <div className="grid gap-6 lg:grid-cols-2">
              <ScrollReveal delay={0.1}>
                <MyIdeas userId={user.id} />
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <LiveActivity />
              </ScrollReveal>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <ScrollReveal delay={0.2}>
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" /> Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Study Hours", current: 12, goal: 20 },
                      { label: "Notes Uploaded", current: stats.notesCount, goal: 10 },
                      { label: "Ideas Posted", current: stats.ideasCount, goal: 5 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.current}/{item.goal}</span>
                        </div>
                        <Progress value={Math.min((item.current / item.goal) * 100, 100)} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </ScrollReveal>
              <ScrollReveal delay={0.25}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5" /> Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { title: "Knowledge Sharer", desc: "Uploaded 5 notes", icon: "📚", earned: stats.notesCount >= 5 },
                        { title: "Innovator", desc: "Posted 3 ideas", icon: "💡", earned: stats.ideasCount >= 3 },
                        { title: "Team Player", desc: "Joined 2 teams", icon: "🤝", earned: stats.teamsCount >= 2 },
                        { title: "Streak Master", desc: "7-day login streak", icon: "🔥", earned: false },
                      ].map((a, i) => (
                        <div key={i} className={`flex items-start gap-3 ${!a.earned ? "opacity-40" : ""}`}>
                          <span className="text-xl">{a.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.desc}</p>
                          </div>
                          {a.earned && <Star className="h-4 w-4 fill-primary text-primary ml-auto shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <NotificationsPanel userId={user.id} />
              </ScrollReveal>
            </div>
            <ScrollReveal delay={0.35}>
              <LearningProgress />
            </ScrollReveal>
          </div>
        );
      case "ideas":
        return <MyIdeas userId={user.id} />;
      case "collaborations":
        return <MyCollaborations userId={user.id} />;
      case "requests":
        return <JoinRequestsManager userId={user.id} />;
      case "teams":
        return <MyTeams userId={user.id} />;
      case "progress":
        return <LearningProgress />;
      case "notifications":
        return <NotificationsPanel userId={user.id} />;
      case "live":
        return <LiveActivity />;
      case "profile":
        return <ProfileManager userId={user.id} email={user.email || ""} />;
      case "links":
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks.map((link, i) => (
              <ScrollReveal key={link.href} delay={i * 0.04}>
                <Link to={link.href}>
                  <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                    <CardContent className="p-6 text-center">
                      <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-muted ${link.color}`}>
                        <link.icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold text-sm">{link.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{link.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <ScrollReveal>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                {user ? "Control Center" : "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">Your single source of truth for all activity</p>
            </div>
            <div className="flex items-center gap-3">
              {user && <SyncStatusIndicator status={syncStatus} />}
              {!user && (
                <Link to="/auth">
                  <Button className="gap-2"><ArrowRight className="h-4 w-4" /> Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </ScrollReveal>

        {user ? (
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <aside className="hidden md:block w-56 shrink-0">
              <nav className="sticky top-24 space-y-1">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      {item.id === "notifications" && stats.notificationsCount > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0">
                          {stats.notificationsCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile nav */}
            <div className="md:hidden w-full mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {renderSection()}
            </main>
          </div>
        ) : (
          <Card className="max-w-lg mx-auto text-center p-8">
            <LayoutDashboard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign in to access your Control Center</h2>
            <p className="text-muted-foreground mb-6">Track ideas, teams, and all your activity in one place</p>
            <Link to="/auth"><Button size="lg">Sign In <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
