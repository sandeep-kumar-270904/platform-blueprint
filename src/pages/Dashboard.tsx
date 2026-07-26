import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSyncStatusToast } from "@/hooks/useSyncStatusToast";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, Lightbulb, Users, Bell, Star,
  ArrowRight, Handshake, Radio, User, UserPlus,
  Calendar, Target, GraduationCap, MessageSquare, Briefcase,
  Flame, Award, TrendingUp, BarChart2, Lock, Building2
} from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyCourses } from "@/components/dashboard/MyCourses";
import { MyIdeas } from "@/components/dashboard/MyIdeas";
import { MyCollaborations } from "@/components/dashboard/MyCollaborations";
import { MyTeams } from "@/components/dashboard/MyTeams";
import { HostAnalytics } from "@/components/dashboard/HostAnalytics";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { LiveActivity } from "@/components/dashboard/LiveActivity";
import { UpcomingSessions } from "@/components/dashboard/UpcomingSessions";
import { ProfileManager } from "@/components/dashboard/ProfileManager";
import { ReferralsManager } from "@/components/dashboard/ReferralsManager";
import { JoinRequestsManager } from "@/components/dashboard/JoinRequestsManager";
import { LearningProgress } from "@/components/dashboard/LearningProgress";
import { SecuritySettings } from "@/components/dashboard/SecuritySettings";
import { SavedColleges } from "@/components/dashboard/SavedColleges";
import { MyActivity } from "@/components/dashboard/MyActivity";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { MyMentorBookings } from "@/components/dashboard/MyMentorBookings";
import { MentorSessionManagement } from "@/components/dashboard/MentorSessionManagement";
import { CareerVisibilityManager } from "@/components/dashboard/CareerVisibilityManager";
import { MenteeSubscription } from "@/components/dashboard/MenteeSubscription";
import { PlacementPrepWidget } from "@/components/dashboard/PlacementPrepWidget";

type Section = "overview" | "courses" | "ideas" | "collaborations" | "requests" | "teams" | "progress" | "notifications" | "notification-settings" | "live" | "analytics" | "profile" | "referrals" | "subscription" | "career-visibility" | "security" | "links" | "saved-colleges" | "activity" | "mentor-bookings" | "mentor-management";

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "courses", label: "My Learning", icon: BookOpen },
  { id: "ideas", label: "My Ideas", icon: Lightbulb },
  { id: "collaborations", label: "Collaborations", icon: Handshake },
  { id: "requests", label: "Join Requests", icon: UserPlus },
  { id: "teams", label: "My Teams", icon: Users },
  { id: "progress", label: "Learning Progress", icon: TrendingUp },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "notification-settings", label: "Notification Settings", icon: Bell },
  { id: "live", label: "Live Activity", icon: Radio },
  { id: "analytics", label: "Host Analytics", icon: BarChart2 },
  { id: "saved-colleges", label: "Saved Colleges", icon: Building2 },
  { id: "activity", label: "Activity & Events", icon: Star },
  { id: "mentor-bookings", label: "My Mentorship", icon: Handshake },
  { id: "mentor-management", label: "Mentor Dashboard", icon: Briefcase },
  { id: "profile", label: "Profile", icon: User },
  { id: "referrals", label: "Wallet & Referrals", icon: Users },
  { id: "subscription", label: "My Subscription", icon: Star },
  { id: "career-visibility", label: "Career Visibility", icon: Briefcase },
  { id: "security", label: "Security", icon: Lock },
  { id: "links", label: "Quick Links", icon: ArrowRight },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { id: impersonateUserId } = useParams();
  const targetUserId = impersonateUserId || user?.id;

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [stats, setStats] = useState({
    notesCount: 0, notesViews: 0, notesDownloads: 0,
    notesAvgRating: 0, ideasCount: 0, teamsCount: 0, notificationsCount: 0,
  });
  const [gamification, setGamification] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const url = new URL(`${API_URL}/api/dashboard/stats`);
      if (impersonateUserId) url.searchParams.append('userId', impersonateUserId);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      
      setStats({
        notesCount: data.notes.total,
        notesViews: data.notes.views,
        notesDownloads: data.notes.downloads,
        notesAvgRating: 0,
        ideasCount: data.ideas,
        teamsCount: data.teams,
        notificationsCount: data.notifications,
      });
      if (data.gamification) {
        setGamification(data.gamification);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  // Realtime subscriptions filtered to current user only — respects RLS scope.
  const syncStatus = useRealtimeSync({
    channelName: user ? `dashboard-stats-${targetUserId}` : undefined,
    enabled: !!user,
    filters: [],
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
    { title: "Quiz Hub", href: "/quizzes", icon: Target, desc: "Test knowledge", color: "text-orange-500" },
    { title: "Forum", href: "/forum", icon: MessageSquare, desc: "Discuss", color: "text-pink-500" },
    { title: "Passport", href: "/founders-passport", icon: Flame, desc: "Innovation ID", color: "text-orange-500" },
  ];

  const renderSection = () => {
    if (!targetUserId) return null;

    switch (activeSection) {
      case "courses":
        return <MyCourses />;
      case "overview":
        return (
          <div className="space-y-6">
            <DashboardOverview stats={stats} setActiveSection={setActiveSection} />
            
            <ScrollReveal delay={0.05}>
              <div className="mb-6">
                <PlacementPrepWidget />
              </div>
            </ScrollReveal>

            <div className="grid gap-6 lg:grid-cols-3">
              <ScrollReveal delay={0.1}>
                <MyIdeas userId={targetUserId} />
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <UpcomingSessions userId={targetUserId} />
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <LiveActivity />
              </ScrollReveal>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <ScrollReveal delay={0.2}>
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-4 w-4" /> Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Current Streak (Days)", current: gamification?.current_streak || 0, goal: 7 },
                      { label: "Notes Uploaded", current: gamification?.notes_count || stats.notesCount, goal: 10 },
                      { label: "Ideas Posted", current: gamification?.ideas_count || stats.ideasCount, goal: 5 },
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
                      <Award className="h-4 w-4" /> Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { title: "Knowledge Sharer", desc: "Uploaded 5 notes", icon: "📚", earned: gamification?.badges?.knowledge_sharer || stats.notesCount >= 5 },
                        { title: "Innovator", desc: "Posted 3 ideas", icon: "💡", earned: gamification?.badges?.innovator || stats.ideasCount >= 3 },
                        { title: "Team Player", desc: "Joined 2 teams", icon: "🤝", earned: gamification?.badges?.team_player || stats.teamsCount >= 2 },
                        { title: "Streak Master", desc: "7-day login streak", icon: "🔥", earned: gamification?.badges?.streak_master || false },
                        { title: "Classroom Host", desc: "Hosted a virtual class", icon: "🎓", earned: gamification?.badges?.classroom_host || false },
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
                <NotificationsPanel userId={targetUserId} />
              </ScrollReveal>
            </div>
            <ScrollReveal delay={0.35}>
              <LearningProgress />
            </ScrollReveal>
          </div>
        );
      case "ideas":
        return <MyIdeas userId={targetUserId} />;
      case "collaborations":
        return <MyCollaborations userId={targetUserId} />;
      case "requests":
        return <JoinRequestsManager userId={targetUserId} />;
      case "teams":
        return <MyTeams userId={targetUserId} />;
      case "progress":
        return <LearningProgress />;
      case "notifications":
        return <NotificationsPanel userId={targetUserId} />;
      case "notification-settings":
        return <NotificationSettings />;
      case "live":
        return <LiveActivity />;
      case "analytics":
        return <HostAnalytics userId={targetUserId} />;
      case "profile":
        return <ProfileManager userId={targetUserId} email={user?.email || ""} />;
      case "referrals":
        return <ReferralsManager />;
      case "subscription":
        return <MenteeSubscription />;
      case "career-visibility":
        return <CareerVisibilityManager />;
      case "security":
        return <SecuritySettings />;
      case "saved-colleges":
        return <SavedColleges />;
      case "activity":
        return <MyActivity />;
      case "mentor-bookings":
        return <MyMentorBookings />;
      case "mentor-management":
        return <MentorSessionManagement />;
      case "links":
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks.map((link, i) => (
              <ScrollReveal key={link.href} delay={i * 0.04}>
                <Link to={link.href}>
                  <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                    <CardContent className="p-6 text-center">
                      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${link.color}`}>
                        <link.icon className="h-6 w-6" />
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-6 pb-6">
        <ScrollReveal>
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-3">
              {user && <SyncStatusIndicator status={syncStatus} />}
              {!user && !impersonateUserId && (
                <Link to="/auth">
                  <Button className="gap-2"><ArrowRight className="h-4 w-4" /> Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </ScrollReveal>

        
        {impersonateUserId && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 flex justify-between items-center shadow-lg">
            <div>
              <h3 className="font-bold">Admin Impersonation Mode</h3>
              <p className="text-sm opacity-90">Viewing dashboard for user: {impersonateUserId}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={async () => {
                const token = localStorage.getItem('token');
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/users/${impersonateUserId}/adjust-points`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ points: 500 })
                });
                fetchStats();
              }}>
                +500 Points
              </Button>
            </div>
          </div>
        )}

        {user || impersonateUserId ? (
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
