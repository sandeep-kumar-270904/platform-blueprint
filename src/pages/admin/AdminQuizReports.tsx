import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, CheckCircle, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminQuizReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionType, setActionType] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [actioning, setActioning] = useState(false);

  const [aiReviews, setAiReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  const fetchAiReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/quiz-review/pending`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setAiReviews(await res.json());
    } catch (err) {
      toast.error("Failed to load AI reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewAction = async (quizId: string, action: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/quiz-review/${quizId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Failed to process action");
      toast.success(`Quiz ${action}d successfully`);
      fetchAiReviews();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.append('status', statusFilter);
      
      const res = await fetch(`${API_URL}/api/admin/quiz-reports?${qs.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchAiReviews();
  }, [statusFilter]);

  const openActionDialog = (report: any) => {
    setSelectedReport(report);
    setActionType('');
    setAdminNote('');
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!actionType) return toast.error("Please select an action");
    
    setActioning(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/quiz-reports/${selectedReport._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: actionType, adminNote })
      });
      
      if (!res.ok) throw new Error("Failed to process action");
      
      toast.success("Report actioned successfully");
      setActionDialogOpen(false);
      fetchReports();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Header />
      
      <div className="container max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              Quiz Moderation
            </h1>
            <p className="text-muted-foreground mt-1">Review flagged quizzes and take moderation action.</p>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed_actioned">Actioned</SelectItem>
              <SelectItem value="reviewed_dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="reports">User Reports</TabsTrigger>
            <TabsTrigger value="ai-reviews">AI Review Queue ({aiReviews.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports">
            <div className="bg-background rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No reports found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      {report.targetId ? (
                        <div>
                          <div className="font-medium">{report.targetId.title}</div>
                          {report.targetId.status === 'under_review' && (
                            <Badge variant="destructive" className="mt-1 text-[10px]">Auto-Hidden</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted Quiz</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium capitalize">{report.reason.replace('_', ' ')}</div>
                      {report.details && <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-1" title={report.details}>{report.details}</div>}
                    </TableCell>
                    <TableCell>{report.reportedBy?.full_name || report.reportedBy?.username || 'Unknown'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(report.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'pending' ? 'secondary' : report.status === 'reviewed_actioned' ? 'destructive' : 'default'}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {report.status === 'pending' ? (
                        <Button variant="outline" size="sm" onClick={() => openActionDialog(report)}>
                          Review
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => openActionDialog(report)}>
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="ai-reviews">
        <div className="bg-background rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingReviews ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : aiReviews.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No pending AI quizzes.</TableCell></TableRow>
              ) : (
                aiReviews.map((quiz) => (
                  <TableRow key={quiz._id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.category}</TableCell>
                    <TableCell>{quiz.createdBy?.full_name || 'Unknown'}</TableCell>
                    <TableCell>{quiz.questions?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => handleReviewAction(quiz._id, 'approve')}>Approve</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleReviewAction(quiz._id, 'reject')}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  </div>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedReport?.status === 'pending' ? 'Review Report' : 'Report Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/30 p-3 rounded-md text-sm">
                <p><strong>Quiz:</strong> {selectedReport.targetId?.title || 'Deleted'}</p>
                <p><strong>Reason:</strong> {selectedReport.reason}</p>
                <p><strong>Details:</strong> {selectedReport.details || 'None provided'}</p>
              </div>

              {selectedReport.status === 'pending' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Action to Take</label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dismiss">
                          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Dismiss (Safe)</div>
                        </SelectItem>
                        <SelectItem value="warn_creator">
                          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Warn Creator</div>
                        </SelectItem>
                        <SelectItem value="delete_quiz">
                          <div className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Delete Quiz</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Note (Internal)</label>
                    <Textarea 
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Why did you take this action?"
                    />
                  </div>
                </>
              ) : (
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p><strong>Resolution:</strong> {selectedReport.status}</p>
                  <p><strong>Admin Note:</strong> {selectedReport.adminNote || 'None'}</p>
                  <p><strong>Actioned At:</strong> {selectedReport.reviewedAt ? format(new Date(selectedReport.reviewedAt), 'PPp') : 'Unknown'}</p>
                </div>
              )}
            </div>
          )}
          
          {selectedReport?.status === 'pending' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAction} disabled={!actionType || actioning}>
                {actioning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Action
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuizReports;
