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
  Flame, Award, TrendingUp, BarChart2, Lock, Building2, RefreshCw, Sparkles
} from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyIdeas } from "@/components/dashboard/MyIdeas";
import { MyCollaborations } from "@/components/dashboard/MyCollaborations";
import { MyTeams } from "@/components/dashboard/MyTeams";
import { TeamHuntDashboardWidget } from "@/components/dashboard/TeamHuntDashboardWidget";
import { SkillSwapDashboardWidget } from "@/components/dashboard/SkillSwapDashboardWidget";
import { CreatorDashboardWidget } from "@/components/dashboard/CreatorDashboardWidget";
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
import { RepairDashboardWidget } from "@/components/dashboard/RepairDashboardWidget";
import { RoommatesDashboardWidget } from "@/components/dashboard/RoommatesDashboardWidget";

type Section = "overview" | "courses" | "ideas" | "collaborations" | "requests" | "teams" | "skill-swap" | "creators" | "progress" | "notifications" | "notification-settings" | "live" | "analytics" | "profile" | "referrals" | "subscription" | "career-visibility" | "security" | "links" | "saved-colleges" | "activity" | "mentor-bookings" | "mentor-management";

const navGroups = [
  {
    label: "LEARN",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "progress", label: "Learning Progress", icon: TrendingUp },
    ]
  },
  {
    label: "COLLABORATE",
    items: [
      { id: "ideas", label: "My Ideas", icon: Lightbulb },
      { id: "teams", label: "My Teams", icon: Users },
      { id: "collaborations", label: "Collaborations", icon: Handshake },
      { id: "requests", label: "Join Requests", icon: UserPlus },
    ]
  },
  {
    label: "MANAGE",
    items: [
      { id: "creators", label: "Creators Zone", icon: Sparkles },
      { id: "mentor-bookings", label: "My Mentorship", icon: Handshake },
      { id: "mentor-management", label: "Mentor Dashboard", icon: Briefcase },
      { id: "skill-swap", label: "Skill Swap", icon: RefreshCw },
      { id: "analytics", label: "Host Analytics", icon: BarChart2 },
      { id: "activity", label: "Activity & Events", icon: Star },
    ]
  },
  {
    label: "ACCOUNT",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "notification-settings", label: "Notification Settings", icon: Bell },
      { id: "referrals", label: "Wallet & Referrals", icon: Users },
      { id: "subscription", label: "My Subscription", icon: Star },
      { id: "career-visibility", label: "Career Visibility", icon: Briefcase },
      { id: "security", label: "Security", icon: Lock },
    ]
  },
  {
    label: "QUICK LINKS",
    items: [
      { id: "live", label: "Live Activity", icon: Radio },
      { id: "saved-colleges", label: "Saved Colleges", icon: Building2 },
      { id: "links", label: "Quick Links", icon: ArrowRight },
    ]
  }
] as const;

const navItems = navGroups.flatMap(g => g.items);

const Dashboard = () => {
  const { user } = useAuth();
  const { id: impersonateUserId } = useParams();
  const targetUserId = impersonateUserId || user?.id;

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [stats, setStats] = useState({
    notesCount: 0, notesViews: 0, notesDownloads: 0,
    ideasCount: 0, teamsCount: 0, notificationsCount: 0,
    totalQuizzes: 0, avgQuizScore: 0, classroomsCount: 0, eventsCount: 0, currentStreak: 0
  });
  const [achievements, setAchievements] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const url = new URL(`${API_URL}/api/dashboard/summary`);
      if (impersonateUserId) url.searchParams.append('userId', impersonateUserId);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      
      setStats({
        notesCount: data.stats.notesCount ?? null,
        notesViews: data.stats.notesViews ?? null,
        notesDownloads: data.stats.notesDownloads ?? null,
        ideasCount: data.stats.ideasCount ?? null,
        teamsCount: data.stats.teamsCount ?? null,
        notificationsCount: data.stats.notificationsCount ?? null,
        totalQuizzes: data.stats.totalQuizzes ?? null,
        avgQuizScore: data.stats.avgQuizScore ?? null,
        classroomsCount: data.stats.classroomsCount ?? null,
        eventsCount: data.stats.eventsCount ?? null,
        currentStreak: data.stats.currentStreak ?? null
      });
      setAchievements(data.achievements || []);
      if (data.gamification) {
        setGamification(data.gamification);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsStatsLoading(false);
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
      case "overview":
        return (
          <div className="space-y-6">
            <DashboardOverview stats={stats} achievements={achievements} setActiveSection={setActiveSection} isLoading={isStatsLoading} />
          </div>
        );
      case "ideas":
        return <MyIdeas userId={targetUserId} />;
      case "collaborations":
        return <MyCollaborations userId={targetUserId} />;
      case "requests":
        return <JoinRequestsManager userId={targetUserId} />;
      case "teams":
        return <TeamHuntDashboardWidget />;
      case "skill-swap":
        return <SkillSwapDashboardWidget />;
      case "creators":
        return <CreatorDashboardWidget />;
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
              <nav className="sticky top-24 space-y-6">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <h4 className="px-4 text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2">
                      {group.label}
                    </h4>
                    {group.items.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
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
                  </div>
                ))}
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

