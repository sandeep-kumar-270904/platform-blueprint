import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Ban, Undo, Eye, EyeOff } from "lucide-react";

export default function MentorsAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchPending();
    fetchFlagged();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentors/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setStats(await res.json());
  };

  const fetchPending = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentors/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setPending(await res.json());
  };

  const fetchFlagged = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentor-reviews/flagged`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setFlaggedReviews(await res.json());
  };

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentors/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      toast({ title: "Approved" });
      fetchPending();
      fetchStats();
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentors/${id}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (res.ok) {
      toast({ title: "Rejected" });
      fetchPending();
    }
  };

  const handleSuspend = async (id: string) => {
    const reason = prompt("Enter suspension reason:");
    if (!reason) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentors/${id}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (res.ok) {
      toast({ title: "Suspended" });
      fetchStats(); // Update active count
    }
  };

  const handleModerateReview = async (id: string, action: 'hide' | 'unhide') => {
    const reason = prompt(`Enter reason to ${action}:`);
    if (!reason) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mentor-reviews/${id}/moderate`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason })
    });
    if (res.ok) {
      toast({ title: `Review ${action === 'hide' ? 'hidden' : 'unhidden'}` });
      fetchFlagged();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mentors Admin Dashboard</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
          <TabsTrigger value="applications">Applications ({pending.length})</TabsTrigger>
          <TabsTrigger value="moderation">Review Moderation</TabsTrigger>
          <TabsTrigger value="actions">Mentor Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Active Mentors</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.totalActiveMentors}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Total Sessions (Month)</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.totalSessionsThisMonth}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Total AMAs</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.totalAMAsHosted}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Revenue (Month)</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold text-green-600">₹{stats.platformRevenueThisMonth}</p></CardContent>
              </Card>
            </div>
          ) : <p>Loading analytics...</p>}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {pending.length === 0 ? (
            <p className="text-muted-foreground">No pending applications.</p>
          ) : (
            pending.map(p => (
              <Card key={p._id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{p.user_id?.full_name} - {p.title} at {p.company}</CardTitle>
                    <CardDescription>{p.user_id?.email}</CardDescription>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleReject(p._id)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                    <Button size="sm" onClick={() => handleApprove(p._id)}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{p.bio}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          {flaggedReviews.length === 0 ? (
            <p className="text-muted-foreground">No flagged reviews.</p>
          ) : (
            flaggedReviews.map(r => (
              <Card key={r._id} className="border-destructive">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Review by {r.menteeId?.full_name}</CardTitle>
                    <CardDescription>For Mentor: {r.mentorId?.full_name}</CardDescription>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleModerateReview(r._id, 'unhide')}><Undo className="mr-2 h-4 w-4" /> Clear Flag</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleModerateReview(r._id, 'hide')}><EyeOff className="mr-2 h-4 w-4" /> Hide Review</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">Rating: {r.rating} / 5</p>
                  <p className="text-sm mt-2">{r.writtenFeedback}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Suspend a Mentor</CardTitle>
              <CardDescription>Enter the Mentor Profile ID to suspend them. They will be unlisted.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <form onSubmit={(e: any) => { e.preventDefault(); handleSuspend(e.target.mentorId.value); }} className="flex gap-4">
                <input name="mentorId" placeholder="Mentor Profile ID..." className="border rounded-md px-3 py-2 w-64" required />
                <Button variant="destructive" type="submit"><Ban className="mr-2 h-4 w-4"/> Suspend</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
