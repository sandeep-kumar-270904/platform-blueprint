import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, Briefcase, GraduationCap, FileText, Activity, MessageSquare, ShieldAlert, BarChart3, AlertTriangle, Users, Video, Building2, Wrench, Home
} from "lucide-react";
import { AdminModerationQueue } from "@/components/admin/AdminModerationQueue";
import { AdminFinancials } from "@/components/admin/AdminFinancials";
import { AdminFeedMetrics } from "@/components/admin/AdminFeedMetrics";
import { AdminClassrooms } from "@/components/admin/AdminClassrooms";
import { AdminDatabaseExplorer } from "@/components/admin/AdminDatabaseExplorer";
import { AdminAnalyticsHub } from "@/components/admin/AdminAnalyticsHub";
import { AdminPageManager } from "@/components/admin/AdminPageManager";
import { AdminTeamModeration } from "@/components/admin/AdminTeamModeration";
import { AdminSkillSwap } from "@/components/admin/AdminSkillSwap";
import { AdminCreatorsModeration } from "@/components/admin/AdminCreatorsModeration";
import { AdminAlumniVerification } from "@/components/admin/AdminAlumniVerification";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminPanel = () => {
  const { isAdmin, loading: authLoading } = useAdmin();
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchGlobalStats();
    }
  }, [isAdmin]);

  const fetchGlobalStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/stats/global`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGlobalStats(await res.json());
      }
    } catch (error) {
      console.error("Failed to load global stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <ShieldAlert className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-500">Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have administrative privileges.</p>
          <Button asChild><Link to="/">Return to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-muted-foreground mt-2">Centralized management across all StudentHub modules.</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white border p-1 rounded-lg">
            <TabsTrigger value="overview"><BarChart3 className="mr-2 h-4 w-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="analytics"><Activity className="mr-2 h-4 w-4" /> Analytics Hub</TabsTrigger>
            <TabsTrigger value="database"><FileText className="mr-2 h-4 w-4" /> DB Explorer</TabsTrigger>
            <TabsTrigger value="moderation">
              <AlertTriangle className="mr-2 h-4 w-4" /> Moderation Queue
              {globalStats?.pendingReports > 0 && <Badge variant="destructive" className="ml-2">{globalStats.pendingReports}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="financials">
              <DollarSign className="mr-2 h-4 w-4" /> Financials
              {globalStats?.openDisputes > 0 && <Badge variant="destructive" className="ml-2">{globalStats.openDisputes}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="feed-metrics">
              <Activity className="mr-2 h-4 w-4" /> Feed Metrics
            </TabsTrigger>
            <TabsTrigger value="site-pages">
              <FileText className="mr-2 h-4 w-4" /> Site Pages
            </TabsTrigger>
            <TabsTrigger value="team-moderation">
              <Users className="mr-2 h-4 w-4" /> Teams
            </TabsTrigger>
            <TabsTrigger value="skill-swap">
              <Activity className="mr-2 h-4 w-4" /> Skill Swap
            </TabsTrigger>
            <TabsTrigger value="creators">
              <Video className="mr-2 h-4 w-4" /> Creators Zone
            </TabsTrigger>
            <TabsTrigger value="alumni">
              <GraduationCap className="mr-2 h-4 w-4" /> Alumni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Verifications</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{globalStats?.pendingVerifications || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Mentors & Recruiters</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reports Queue</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{globalStats?.pendingReports || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all modules</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Disputes</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{globalStats?.openDisputes || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires financial resolution</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Institution Seats</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{globalStats?.seats?.used || 0} / {globalStats?.seats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total platform utilization</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Module Dashboards</CardTitle>
                  <CardDescription>Deep dive into specific module settings and verifications.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/mentors"><Users className="mr-3 h-5 w-5 text-blue-500" /> Mentors & Enterprise Cohorts</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/jobs"><Briefcase className="mr-3 h-5 w-5 text-orange-500" /> Job Board & Recruiters</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/colleges"><GraduationCap className="mr-3 h-5 w-5 text-purple-500" /> College Insights</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/resumes"><FileText className="mr-3 h-5 w-5 text-indigo-500" /> Resume Builder & AI</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/community"><MessageSquare className="mr-3 h-5 w-5 text-teal-500" /> Community Feed</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/placement"><Activity className="mr-3 h-5 w-5 text-green-500" /> Placement Prep</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/study-groups"><Users className="mr-3 h-5 w-5 text-indigo-500" /> Peer Study Groups</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/classrooms"><Video className="mr-3 h-5 w-5 text-red-500" /> Virtual Classrooms</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/skill-swap"><Activity className="mr-3 h-5 w-5 text-pink-500" /> Skill Swap Moderation</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/creators"><Video className="mr-3 h-5 w-5 text-indigo-500" /> Creators Zone Moderation</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/hostels"><Building2 className="mr-3 h-5 w-5 text-emerald-500" /> Student Hostels Moderation</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/roommates"><Home className="mr-3 h-5 w-5 text-cyan-500" /> Roommate Finder Moderation</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/repair"><Wrench className="mr-3 h-5 w-5 text-gray-600" /> Repair & Maintenance</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/alumni"><GraduationCap className="mr-3 h-5 w-5 text-blue-500" /> Alumni Verification</Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 text-left" asChild>
                    <Link to="/admin/salary-moderation"><DollarSign className="mr-3 h-5 w-5 text-green-600" /> Salary Insights Moderation</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Lookup & Impersonation</CardTitle>
                  <CardDescription>Enter a User ID to view their dashboard securely.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="impersonate-user-id" 
                      placeholder="Paste User ID here..." 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <Button onClick={() => {
                      const id = (document.getElementById('impersonate-user-id') as HTMLInputElement).value;
                      if(id) window.location.href = `/admin/users/${id}/dashboard`;
                    }}>
                      View Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Bans & Suspensions</CardTitle>
                </CardHeader>
                <CardContent>
                  {globalStats?.recentBans?.length === 0 ? (
                    <p className="text-muted-foreground">No recent bans.</p>
                  ) : (
                    <div className="space-y-4">
                      {globalStats?.recentBans?.map((user: any) => (
                        <div key={user._id} className="flex justify-between items-center border-b pb-2 last:border-0">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.banReason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/users/${user._id}/dashboard`}>View Dash</Link>
                            </Button>
                            <Badge variant="destructive">Banned</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminAnalyticsHub />
          </TabsContent>

          <TabsContent value="database" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminDatabaseExplorer />
          </TabsContent>

          <TabsContent value="moderation" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminModerationQueue />
          </TabsContent>

          <TabsContent value="financials" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminFinancials />
          </TabsContent>

          <TabsContent value="feed-metrics" className="bg-white p-6 rounded-xl">
            <AdminFeedMetrics />
          </TabsContent>
          
          <TabsContent value="site-pages" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminPageManager />
          </TabsContent>

          <TabsContent value="team-moderation">
            <AdminTeamModeration />
          </TabsContent>

          <TabsContent value="skill-swap" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminSkillSwap />
          </TabsContent>

          <TabsContent value="creators" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminCreatorsModeration />
          </TabsContent>

          <TabsContent value="alumni" className="bg-white p-6 rounded-xl border shadow-sm">
            <AdminAlumniVerification />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
