import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Users, FileText, MessageSquare, AlertTriangle, Activity } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function CommunityAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analytics");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'moderator') {
      navigate('/');
      toast.error("Unauthorized access");
    }
  }, [user, navigate]);

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:5000/api/admin/community/${tab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch data");
      const result = await res.json();
      setData(result);
    } catch (err) {
      toast.error("Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Community Admin</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="analytics" className="gap-2">
                <Activity className="h-4 w-4" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <FileText className="h-4 w-4" /> Posts
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" /> Comments
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <AlertTriangle className="h-4 w-4" /> Reports
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" /> Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-4">
              {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto mt-10" /> : data && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.totalPosts}</div>
                      <p className="text-xs text-muted-foreground">{data.activePosts} active, {data.postsToday} today</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.totalComments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.totalReports}</div>
                      <p className="text-xs text-muted-foreground">{data.pendingReports} pending</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Content Snippet</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.posts?.map((post: any) => (
                          <TableRow key={post._id}>
                            <TableCell>{post.user_id?.username}</TableCell>
                            <TableCell className="max-w-xs truncate">{post.text}</TableCell>
                            <TableCell><Badge variant="outline">{post.status}</Badge></TableCell>
                            <TableCell>{format(new Date(post.created_at || post.createdAt), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/community/post/${post._id}`)}>View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.comments?.map((comment: any) => (
                          <TableRow key={comment._id}>
                            <TableCell>{comment.author?.username}</TableCell>
                            <TableCell className="max-w-xs truncate">{comment.text}</TableCell>
                            <TableCell>{format(new Date(comment.created_at || comment.createdAt), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.reports?.map((report: any) => (
                          <TableRow key={report._id}>
                            <TableCell>{report.reporting_user_id?.username}</TableCell>
                            <TableCell>{report.reason}</TableCell>
                            <TableCell><Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>{report.status}</Badge></TableCell>
                            <TableCell>{format(new Date(report.createdAt), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Community Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.users?.map((u: any) => (
                          <TableRow key={u._id}>
                            <TableCell>{u.username}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                            <TableCell>{format(new Date(u.created_at || u.createdAt), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
}
