import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  BookOpen, Eye, Star, Lightbulb, Users, Bell, Download, Search, Calendar, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThisWeekStrip } from "./ThisWeekStrip";
import { RecommendedColleges } from "./RecommendedColleges";
import { RecommendedCourses } from "./RecommendedCourses";
import { ResumeLearning } from "./ResumeLearning";
import { RecentNotifications } from "./RecentNotifications";
import { CommunityDashboardWidget } from "./CommunityDashboardWidget";
import { VirtualClassroomWidget } from "../virtual-classroom/VirtualClassroomWidget";
import { TeamHuntDashboardWidget } from "./TeamHuntDashboardWidget";
import { CreatorDashboardWidget } from "./CreatorDashboardWidget";
import { StudyGroupsDashboardWidget } from "./StudyGroupsDashboardWidget";

interface Stats {
  notesCount: number;
  notesViews: number;
  notesDownloads: number;
  notesAvgRating: number;
  ideasCount: number;
  teamsCount: number;
  notificationsCount: number;
}

const icons = [BookOpen, Eye, Download, Star, Lightbulb, Users, Bell];
const colors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent-foreground",
  "bg-secondary/50 text-secondary-foreground",
  "bg-primary/10 text-primary",
  "bg-yellow-500/10 text-yellow-500",
  "bg-blue-500/10 text-blue-500",
  "bg-red-500/10 text-red-500",
];
const links = ["/notes", "/notes", "/notes", "/notes", "/innovation-hub", "/team-hunt", "#"];

export const DashboardOverview = ({ stats, setActiveSection }: { stats: Stats, setActiveSection?: (s: string) => void }) => {
  const items = [
    { key: "notes", label: "My Notes", value: stats.notesCount },
    { key: "views", label: "Note Views", value: stats.notesViews },
    { key: "downloads", label: "Downloads", value: stats.downloads || stats.notesDownloads },
    { key: "rating", label: "Avg Rating", value: stats.notesAvgRating.toFixed(1) },
    { key: "ideas", label: "My Ideas", value: stats.ideasCount },
    { key: "teams", label: "My Teams", value: stats.teamsCount },
    { key: "notifications", label: "Notifications", value: stats.notificationsCount },
  ];

  const totalActivity = stats.notesCount + stats.ideasCount + stats.teamsCount + stats.notificationsCount;

  return (
    <div className="space-y-6">
      <ThisWeekStrip />
      <ResumeLearning />
      <VirtualClassroomWidget />
      
      {totalActivity === 0 ? (
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border rounded-xl p-8 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to your Dashboard!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Your dashboard is looking a little empty. Start exploring the platform to see your activity, saved items, and personalized recommendations appear here.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/college-insights">
              <Button className="gap-2"><Search className="h-4 w-4" /> Browse Colleges</Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Explore Events</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {items.map((stat, i) => {
            const Icon = icons[i];
            return (
              <ScrollReveal key={i} delay={i * 0.04} direction="scale">
                <Link to={links[i]}>
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[i]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div
                          className="text-xl font-bold"
                          data-testid={`stat-${stat.key}`}
                          data-value={stat.value}
                        >
                          {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {totalActivity > 0 && (
        <ScrollReveal delay={0.1}>
          <CommunityDashboardWidget />
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.11}>
        <StudyGroupsDashboardWidget />
      </ScrollReveal>

      <ScrollReveal delay={0.12}>
        <TeamHuntDashboardWidget />
      </ScrollReveal>

      <ScrollReveal delay={0.14}>
        <CreatorDashboardWidget />
      </ScrollReveal>

      <RecommendedColleges />
      <RecommendedCourses />
      
      {totalActivity > 0 && (
        <div className="mt-8">
          <ScrollReveal delay={0.2}>
            <RecentNotifications onNavigate={() => setActiveSection && setActiveSection("notifications")} />
          </ScrollReveal>
        </div>
      )}
    </div>
  );
};
