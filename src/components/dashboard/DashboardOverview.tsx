import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { useCountUp } from "@/hooks/useCountUp";

import {
  ArrowRight, Users, Lightbulb, Star, Target, Calendar,
  Sparkles, Lock, UserPlus, Flame
} from "lucide-react";

import { PlacementPrepWidget } from "./PlacementPrepWidget";
import { RepairDashboardWidget } from "./RepairDashboardWidget";
import { RoommatesDashboardWidget } from "./RoommatesDashboardWidget";
import { RecentNotifications } from "./RecentNotifications";
import { LiveActivity } from "./LiveActivity";

// Data types from parent
interface Stats {
  notesCount: number | null;
  notesViews: number | null;
  notesDownloads: number | null;
  ideasCount: number | null;
  teamsCount: number | null;
  notificationsCount: number | null;
  totalQuizzes: number | null;
  avgQuizScore: number | null;
  classroomsCount: number | null;
  eventsCount: number | null;
  currentStreak: number | null;
}

export const DashboardOverview = ({ 
  stats, 
  achievements = [],
  setActiveSection, 
  isLoading 
}: { 
  stats: Stats, 
  achievements?: any[],
  setActiveSection?: (s: string) => void,
  isLoading?: boolean 
}) => {
  const currentStreak = stats.currentStreak ?? 0;
  const prefersReducedMotion = useReducedMotion();

  // Greeting Logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Stats counting
  const displayStreak = useCountUp(currentStreak, 800);
  const displayTeams = useCountUp(stats.teamsCount ?? 0, 800);
  const displayIdeas = useCountUp(stats.ideasCount ?? 0, 800);
  const displayNotes = useCountUp(stats.notesCount ?? 0, 800);
  const displayQuizzes = useCountUp(stats.totalQuizzes ?? 0, 800);

  // Dynamic Hero Logic
  let heroCTA = {
    title: "Ready to jump in?",
    description: "You haven't joined a study group or team yet. Connect with peers and start collaborating.",
    actionLabel: "Find a Team",
    actionIcon: ArrowRight,
    actionHref: "/team-hunt"
  };

  if (stats.teamsCount > 0 && stats.ideasCount === 0) {
    heroCTA = {
      title: "Share your ideas",
      description: "You are active in teams! Why not pitch your own startup idea?",
      actionLabel: "Post an Idea",
      actionIcon: Lightbulb,
      actionHref: "/innovation-hub"
    };
  } else if ((stats.teamsCount ?? 0) > 0 && (stats.ideasCount ?? 0) > 0 && (stats.notesCount ?? 0) === 0) {
    heroCTA = {
      title: "Help the community",
      description: "Upload your study notes to help others and earn badges.",
      actionLabel: "Upload Notes",
      actionIcon: ArrowRight,
      actionHref: "/notes"
    };
  } else if ((stats.teamsCount ?? 0) > 0 && (stats.ideasCount ?? 0) > 0 && (stats.notesCount ?? 0) > 0) {
    heroCTA = {
      title: "You're crushing it",
      description: "Keep up the great work! Discover new hackathons and events to showcase your skills.",
      actionLabel: "Explore Events",
      actionIcon: Calendar,
      actionHref: "/events"
    };
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Identity Strip */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-medium flex items-center gap-2">
            {greeting} <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"><span className="sr-only">Live indicator</span></span></span>
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Here is what's happening today.</p>
        </div>
        
        <div className="flex items-center gap-4 border border-border rounded-xl px-4 py-2 bg-card shadow-sm h-[60px]">
          {isLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
            </div>
          ) : (
            <>
              <div className="text-center px-3 border-r border-border">
                <div className="text-[15px] font-medium flex items-center justify-center gap-1">
                  {stats.currentStreak !== null ? (
                    <>
                      {stats.currentStreak > 0 && <Flame className="h-3 w-3 text-orange-500 animate-pulse" />}
                      {displayStreak}
                    </>
                  ) : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Streak</div>
              </div>
              <div className="text-center px-3 border-r border-border">
                <div className="text-[15px] font-medium">{stats.teamsCount !== null ? displayTeams : "—"}</div>
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Teams</div>
              </div>
              <div className="text-center px-3 border-r border-border">
                <div className="text-[15px] font-medium">{stats.ideasCount !== null ? displayIdeas : "—"}</div>
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Ideas</div>
              </div>
              <div className="text-center px-3 border-r border-border">
                <div className="text-[15px] font-medium">{stats.notesCount !== null ? displayNotes : "—"}</div>
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Notes</div>
              </div>
              <div className="text-center px-3">
                <div className="text-[15px] font-medium">{stats.totalQuizzes !== null ? displayQuizzes : "—"}</div>
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Quizzes</div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* 2. Primary Action Module & Explore Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-full">
          {isLoading ? (
            <Skeleton className="h-full min-h-[200px] w-full rounded-xl" />
          ) : (
            <DashboardEmptyState
              tier="primary"
              icon={heroCTA.actionIcon}
              title={heroCTA.title}
              description={heroCTA.description}
              actionLabel={heroCTA.actionLabel}
              actionIcon={ArrowRight}
              actionHref={heroCTA.actionHref}
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          {[
            { to: "/creators", icon: Sparkles, title: "Creators Zone", desc: "Monetize content" },
            { to: "/study-groups", icon: Users, title: "Study Groups", desc: "Join active sessions" },
            { to: "/events", icon: Calendar, title: "Upcoming Events", desc: "Discover hackathons" }
          ].map((item, idx) => (
            <Link 
              key={idx} 
              to={item.to} 
              className="group p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:-translate-y-[1px] active:scale-[0.97] transition-all duration-150 flex items-center gap-3 shadow-sm h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-foreground">{item.title}</div>
                <div className="text-[12px] text-muted-foreground">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* 3. Active Items Row */}
      <motion.div variants={itemVariants}>
        <h2 className="text-[15px] font-medium mb-3">Your active items</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-[76px] rounded-xl" />
              <Skeleton className="h-[76px] rounded-xl" />
              <Skeleton className="h-[76px] rounded-xl" />
            </>
          ) : (
            <>
              <DashboardEmptyState
                tier="secondary"
                icon={Users}
                title={(stats.teamsCount ?? 0) > 0 ? "You have active teams" : "No active teams"}
                actionLabel={(stats.teamsCount ?? 0) > 0 ? "Manage" : "Create"}
                actionHref={(stats.teamsCount ?? 0) > 0 ? "/team-hunt" : "/team-hunt/create"}
              />
              <DashboardEmptyState
                tier="secondary"
                icon={Lightbulb}
                title={(stats.ideasCount ?? 0) > 0 ? "Your ideas are gaining traction" : "No ideas posted"}
                actionLabel={(stats.ideasCount ?? 0) > 0 ? "View" : "Post"}
                actionHref="/innovation-hub"
              />
              <DashboardEmptyState
                tier="secondary"
                icon={UserPlus}
                title="No join requests"
                actionLabel="Browse"
                actionHref="/team-hunt"
              />
            </>
          )}
        </div>
      </motion.div>

      {/* 4. Discovery Row */}
      <motion.div variants={itemVariants}>
        <h2 className="text-[15px] font-medium mb-3">Discover</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <PlacementPrepWidget />
          <RepairDashboardWidget />
          <RoommatesDashboardWidget />
        </div>
      </motion.div>

      {/* 5. Progress Block */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card overflow-hidden shadow-sm rounded-xl">
          <div className="p-5 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-5">
              <h2 className="text-[15px] font-medium">Your progress</h2>
              {isLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-16" />
                  <Skeleton className="h-12 w-16" />
                  <Skeleton className="h-12 w-16" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[20px] font-medium">{stats.notesCount !== null ? displayNotes : "—"}</div>
                    <div className="text-[12px] text-muted-foreground">Notes uploaded</div>
                  </div>
                  <div>
                    <div className="text-[20px] font-medium">{stats.ideasCount !== null ? displayIdeas : "—"}</div>
                    <div className="text-[12px] text-muted-foreground">Ideas posted</div>
                  </div>
                  <div>
                    <div className="text-[20px] font-medium">{stats.teamsCount !== null ? displayTeams : "—"}</div>
                    <div className="text-[12px] text-muted-foreground">Teams joined</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="text-[13px] font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Recent Achievements
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {achievements.length > 0 ? (
                      achievements.map((achievement, idx) => (
                        <Badge key={idx} variant="secondary" className="font-normal text-[12px] bg-muted/50 text-muted-foreground">
                          {achievement.icon === 'flame' && <Flame className="h-3 w-3 mr-1 text-orange-500" />}
                          {achievement.icon === 'target' && <Target className="h-3 w-3 mr-1 text-blue-500" />}
                          {achievement.icon === 'book' && <Sparkles className="h-3 w-3 mr-1 text-purple-500" />}
                          {!achievement.icon && <Lock className="h-3 w-3 mr-1" />}
                          {achievement.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No recent achievements</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 md:border-l md:border-border md:pl-6 space-y-4">
              <h3 className="text-[13px] font-medium">Weekly Goals</h3>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="text-muted-foreground">Current Streak</span>
                      <span className="font-medium">{currentStreak}/7 Days</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                      <motion.div 
                        className="h-full bg-primary" 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStreak / 7) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="text-muted-foreground">Notes Goal</span>
                      <span className="font-medium">{stats.notesCount ?? 0}/10 Uploads</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                      <motion.div 
                        className="h-full bg-primary" 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((stats.notesCount ?? 0) / 10) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="text-muted-foreground">Ideas Goal</span>
                      <span className="font-medium">{stats.ideasCount ?? 0}/5 Posts</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                      <motion.div 
                        className="h-full bg-primary" 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((stats.ideasCount ?? 0) / 5) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 6. Ambient Footer */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div>
          <h2 className="text-[13px] font-medium mb-3 flex items-center justify-between">
            Recent Notifications
            {setActiveSection && (
              <button 
                onClick={() => setActiveSection("notifications")} 
                className="text-[12px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
              >
                View All
              </button>
            )}
          </h2>
          <RecentNotifications onNavigate={() => setActiveSection && setActiveSection("notifications")} />
        </div>
        <div>
          <h2 className="text-[13px] font-medium mb-3">Live Activity</h2>
          <LiveActivity />
        </div>
      </motion.div>
    </motion.div>
  );
};
