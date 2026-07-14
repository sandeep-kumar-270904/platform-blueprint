import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, FileText, AlertTriangle, Shield, Trash2, XCircle,
  RefreshCw, Search, Star, Flag, MessageSquare, BarChart3, Calendar, Check, X
} from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

const AdminPanel = () => {
  const {
    isAdmin, loading, notes, comments, reports, users, stats,
    deleteNote, deleteComment, updateReportStatus, deleteReportedContent, refresh,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("overview");
  const [noteSort, setNoteSort] = useState("newest");
  const [noteSearch, setNoteSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; title: string } | null>(null);

  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchPendingEvents = async () => {
    try {
      setEventsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/events/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "events") {
      fetchPendingEvents();
    }
  }, [isAdmin, activeTab]);

  const handleEventAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      let reason = "";
      if (action === 'reject') {
        reason = prompt("Reason for rejection:") || "";
        if (!reason) return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/events/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        fetchPendingEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Filter + sort notes
  const sortedNotes = [...notes]
    .filter((n) => !noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.subject.toLowerCase().includes(noteSearch.toLowerCase()))
    .sort((a, b) => {
      switch (noteSort) {
        case "low-rating": return (a.rating || 0) - (b.rating || 0);
        case "high-reports": return (b.report_count || 0) - (a.report_count || 0);
        case "low-engagement": return ((a.quality_score || 0)) - ((b.quality_score || 0));
        case "most-downloads": return (b.downloads || 0) - (a.downloads || 0);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const filteredComments = comments.filter(
    (c) => !commentSearch || c.content.toLowerCase().includes(commentSearch.toLowerCase()) || (c.note_title || "").toLowerCase().includes(commentSearch.toLowerCase())
  );

  const reportedComments = comments.filter((c) => c.is_reported);
  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Admin Panel</h1>
              </div>
              <p className="text-muted-foreground">Manage platform content, users, and moderation</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Notes", value: stats.totalNotes, icon: FileText, color: "text-primary" },
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-accent-foreground" },
            { label: "Pending Reports", value: stats.pendingReports, icon: AlertTriangle, color: "text-destructive" },
            { label: "Flagged Notes", value: stats.flaggedNotes, icon: Flag, color: "text-orange-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <s.icon className={`h-4 w-4 mb-1 ${s.color}`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview"><BarChart3 className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="notes"><FileText className="mr-1.5 h-3.5 w-3.5" />Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="comments"><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="reports">
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Reports
              {pendingReports.length > 0 && <Badge variant="destructive" className="ml-1.5 text-xs px-1.5">{pendingReports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-1.5 h-3.5 w-3.5" />Users ({users.length})</TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />Events
              {pendingEvents.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">{pendingEvents.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Reports</CardTitle></CardHeader>
                <CardContent>
                  {pendingReports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending reports 🎉</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingReports.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-start justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={r.content_type === "note" ? "default" : "secondary"}>{r.content_type}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm mt-1">{r.reason}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateReportStatus(r.id, "dismissed")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteReportedContent(r)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Low Quality Notes</CardTitle></CardHeader>
                <CardContent>
                  {notes.filter((n) => (n.quality_score || 0) < 1).length === 0 ? (
                    <p className="text-sm text-muted-foreground">All notes meet quality standards ✅</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.filter((n) => (n.quality_score || 0) < 1).slice(0, 5).map((n) => (
                        <div key={n.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">{n.title}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>⭐ {n.rating.toFixed(1)}</span>
                              <span>👁 {n.views}</span>
                              <span>📥 {n.downloads}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ type: "note", id: n.id, title: n.title })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Reported Comments</CardTitle></CardHeader>
                <CardContent>
                  {reportedComments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reported comments</p>
                  ) : (
                    <div className="space-y-2">
                      {reportedComments.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-start justify-between p-2 rounded border border-destructive/20 bg-destructive/5">
                          <div>
                            <p className="text-sm truncate max-w-[250px]">{c.content}</p>
                            <p className="text-xs text-muted-foreground">on: {c.note_title}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ type: "comment", id: c.id, title: c.content.slice(0, 30) })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Top Contributors</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...users].sort((a, b) => b.notes_count - a.notes_count).slice(0, 5).map((u, i) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground w-4">{i + 1}</span>
                          <span className="text-sm font-medium">{u.full_name || u.username || "Anonymous"}</span>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{u.notes_count} notes</span>
                          <span>⭐ {u.avg_rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search notes..." className="pl-9" value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} />
              </div>
              <Select value={noteSort} onValueChange={setNoteSort}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="low-rating">Low Rating</SelectItem>
                  <SelectItem value="high-reports">Most Reported</SelectItem>
                  <SelectItem value="low-engagement">Low Engagement</SelectItem>
                  <SelectItem value="most-downloads">Most Downloads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-center">Downloads</TableHead>
                    <TableHead className="text-center">Quality</TableHead>
                    <TableHead className="text-center">Reports</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedNotes.slice(0, 50).map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{n.title}</TableCell>
                      <TableCell><Badge variant="outline">{n.subject}</Badge></TableCell>
                      <TableCell className="text-sm">{n.profile?.full_name || n.profile?.username || "Unknown"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm">{n.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{n.views}</TableCell>
                      <TableCell className="text-center text-sm">{n.downloads}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={(n.quality_score || 0) < 1 ? "destructive" : (n.quality_score || 0) < 3 ? "secondary" : "default"}>
                          {(n.quality_score || 0).toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {n.report_count > 0 ? <Badge variant="destructive">{n.report_count}</Badge> : <span className="text-muted-foreground text-sm">0</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ type: "note", id: n.id, title: n.title })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* COMMENTS TAB */}
          <TabsContent value="comments">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search comments..." className="pl-9" value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} />
              </div>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="text-center">Votes</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.slice(0, 50).map((c) => (
                    <TableRow key={c.id} className={c.is_reported ? "bg-destructive/5" : ""}>
                      <TableCell className="max-w-[300px] truncate text-sm">{c.content}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{c.note_title}</TableCell>
                      <TableCell className="text-sm">{c.profile?.full_name || c.profile?.username || "Unknown"}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm ${(c.upvotes - c.downvotes) >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {c.upvotes - c.downvotes > 0 ? "+" : ""}{c.upvotes - c.downvotes}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {c.is_helpful && <Badge variant="default" className="text-xs">Helpful</Badge>}
                          {c.is_reported && <Badge variant="destructive" className="text-xs">Reported</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ type: "comment", id: c.id, title: c.content.slice(0, 30) })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports">
            <Card>
              <CardHeader><CardTitle>Content Reports</CardTitle></CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No reports yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div key={r.id} className={`p-4 rounded-lg border ${r.status === "pending" ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-muted/20"}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={r.content_type === "note" ? "default" : "secondary"}>{r.content_type}</Badge>
                              <Badge variant={r.status === "pending" ? "destructive" : r.status === "reviewed" ? "default" : "outline"}>
                                {r.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm font-medium">{r.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Reported by: {r.reporter_profile?.full_name || r.reporter_profile?.username || "Anonymous"}
                            </p>
                            {r.admin_note && <p className="text-xs text-primary mt-1 italic">Admin: {r.admin_note}</p>}
                          </div>
                          {r.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, "dismissed")}>
                                <XCircle className="mr-1 h-3 w-3" />Dismiss
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteReportedContent(r)}>
                                <Trash2 className="mr-1 h-3 w-3" />Delete Content
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-center">Notes</TableHead>
                    <TableHead className="text-center">Avg Rating</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.username || "—"}</TableCell>
                      <TableCell className="text-center">{u.notes_count}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{u.avg_rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events">
            <Card>
              <CardHeader><CardTitle>Pending Events</CardTitle></CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-muted-foreground" /></div>
                ) : pendingEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending events</p>
                ) : (
                  <div className="space-y-4">
                    {pendingEvents.map((ev) => (
                      <div key={ev._id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="capitalize">{ev.eventType}</Badge>
                            <span className="font-semibold text-lg">{ev.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{ev.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Host: {ev.hostName}</span>
                            <span>Date: {new Date(ev.startDate).toLocaleDateString()}</span>
                            <span>Venue: {ev.isVirtual ? 'Virtual' : ev.venue}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleEventAction(ev._id, 'reject')}>
                            <X className="mr-1 h-4 w-4" /> Reject
                          </Button>
                          <Button size="sm" variant="success" onClick={() => handleEventAction(ev._id, 'approve')}>
                            <Check className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.type === "note") deleteNote(deleteTarget.id);
                else if (deleteTarget?.type === "comment") deleteComment(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
