import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DashboardEmptyState } from "./DashboardEmptyState";

import {
  ArrowRight, Users, Lightbulb, Star, Target, Calendar,
  Sparkles, Lock, UserPlus
} from "lucide-react";

import { PlacementPrepWidget } from "./PlacementPrepWidget";
import { RepairDashboardWidget } from "./RepairDashboardWidget";
import { RoommatesDashboardWidget } from "./RoommatesDashboardWidget";
import { RecentNotifications } from "./RecentNotifications";
import { LiveActivity } from "./LiveActivity";

// Data types from parent
interface Stats {
  notesCount: number;
  notesViews: number;
  notesDownloads: number;
  notesAvgRating: number;
  ideasCount: number;
  teamsCount: number;
  notificationsCount: number;
}

export const DashboardOverview = ({ stats, setActiveSection }: { stats: Stats, setActiveSection?: (s: string) => void }) => {
  const currentStreak = 5; // Placeholder for gamification stats

  return (
    <div className="space-y-6">
      {/* 1. Identity Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-medium flex items-center gap-2">
            Welcome back <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Here is what's happening today.</p>
        </div>
        <div className="flex items-center gap-4 border border-border rounded-xl px-4 py-2 bg-card shadow-sm">
          <div className="text-center px-3 border-r border-border">
            <div className="text-[15px] font-medium">{currentStreak}</div>
            <div className="text-[12px] text-muted-foreground uppercase tracking-wider">Streak</div>
          </div>
          <div className="text-center px-3 border-r border-border">
            <div className="text-[15px] font-medium">{stats.teamsCount}</div>
            <div className="text-[12px] text-muted-foreground uppercase tracking-wider">Teams</div>
          </div>
          <div className="text-center px-3 border-r border-border">
            <div className="text-[15px] font-medium">{stats.ideasCount}</div>
            <div className="text-[12px] text-muted-foreground uppercase tracking-wider">Ideas</div>
          </div>
          <div className="text-center px-3">
            <div className="text-[15px] font-medium">{stats.notesCount}</div>
            <div className="text-[12px] text-muted-foreground uppercase tracking-wider">Notes</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Action Module & Explore Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <DashboardEmptyState
            tier="primary"
            icon={Target}
            title="Ready to jump in?"
            description="You haven't joined a study group or team yet. Connect with peers and start collaborating."
            actionLabel="Find a Team"
            actionIcon={ArrowRight}
            actionHref="/team-hunt"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/creators" className="group p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center gap-3 shadow-sm h-full">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-foreground">Creators Zone</div>
              <div className="text-[12px] text-muted-foreground">Monetize content</div>
            </div>
          </Link>
          <Link to="/study-groups" className="group p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center gap-3 shadow-sm h-full">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-foreground">Study Groups</div>
              <div className="text-[12px] text-muted-foreground">Join active sessions</div>
            </div>
          </Link>
          <Link to="/events" className="group p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center gap-3 shadow-sm h-full">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-foreground">Upcoming Events</div>
              <div className="text-[12px] text-muted-foreground">Discover hackathons</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Active Items Row */}
      <div>
        <h2 className="text-[15px] font-medium mb-3">Your active items</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardEmptyState
            tier="secondary"
            icon={Users}
            title="No active teams"
            actionLabel="Create"
            actionHref="/team-hunt/create"
          />
          <DashboardEmptyState
            tier="secondary"
            icon={Lightbulb}
            title="No ideas posted"
            actionLabel="Post"
            actionHref="/innovation-hub"
          />
          <DashboardEmptyState
            tier="secondary"
            icon={UserPlus}
            title="No join requests"
            actionLabel="Browse"
            actionHref="/team-hunt"
          />
        </div>
      </div>

      {/* 4. Discovery Row */}
      <div>
        <h2 className="text-[15px] font-medium mb-3">Discover</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <PlacementPrepWidget />
          <RepairDashboardWidget />
          <RoommatesDashboardWidget />
        </div>
      </div>

      {/* 5. Progress Block */}
      <Card className="border-border bg-card overflow-hidden shadow-sm rounded-xl">
        <div className="p-5 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-5">
            <h2 className="text-[15px] font-medium">Your progress</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[20px] font-medium">{stats.notesCount}</div>
                <div className="text-[12px] text-muted-foreground">Notes uploaded</div>
              </div>
              <div>
                <div className="text-[20px] font-medium">{stats.ideasCount}</div>
                <div className="text-[12px] text-muted-foreground">Ideas posted</div>
              </div>
              <div>
                <div className="text-[20px] font-medium">{stats.teamsCount}</div>
                <div className="text-[12px] text-muted-foreground">Teams joined</div>
              </div>
            </div>
            
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="text-[13px] font-medium flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Recent Achievements</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal text-[12px] bg-muted/50 text-muted-foreground"><Lock className="h-3 w-3 mr-1" /> Innovator (3 Ideas)</Badge>
                <Badge variant="secondary" className="font-normal text-[12px] bg-muted/50 text-muted-foreground"><Lock className="h-3 w-3 mr-1" /> Team Player (2 Teams)</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex-1 md:border-l md:border-border md:pl-6 space-y-4">
            <h3 className="text-[13px] font-medium">Weekly Goals</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="font-medium">{currentStreak}/7 Days</span>
                </div>
                <Progress value={(currentStreak / 7) * 100} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-muted-foreground">Notes Goal</span>
                  <span className="font-medium">{stats.notesCount}/10 Uploads</span>
                </div>
                <Progress value={Math.min((stats.notesCount / 10) * 100, 100)} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-muted-foreground">Ideas Goal</span>
                  <span className="font-medium">{stats.ideasCount}/5 Posts</span>
                </div>
                <Progress value={Math.min((stats.ideasCount / 5) * 100, 100)} className="h-1.5" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Ambient Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div>
          <h2 className="text-[13px] font-medium mb-3 flex items-center justify-between">
            Recent Notifications
            {setActiveSection && (
              <button onClick={() => setActiveSection("notifications")} className="text-[12px] text-primary hover:underline">View All</button>
            )}
          </h2>
          <RecentNotifications onNavigate={() => setActiveSection && setActiveSection("notifications")} />
        </div>
        <div>
          <h2 className="text-[13px] font-medium mb-3">Live Activity</h2>
          <LiveActivity />
        </div>
      </div>
    </div>
  );
};
