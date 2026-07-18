import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminScholarships = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPending(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleReview = async (status: 'published' | 'rejected') => {
    if (!selectedReview) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/${selectedReview._id}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes })
      });
      
      if (res.ok) {
        toast.success(`Scholarship ${status === 'published' ? 'approved' : 'rejected'}`);
        setSelectedReview(null);
        setReviewNotes("");
        fetchPending();
      } else {
        toast.error("Failed to submit review");
      }
    } catch (err) {
      toast.error("Error submitting review");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Scholarships Administration</h1>
            <p className="text-muted-foreground">Manage organization submissions and flag reports.</p>
          </div>
          <div className="flex gap-4">
             {/* Stub stats */}
             <Card className="w-32">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">{pending.length}</div>
                </CardContent>
             </Card>
          </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Review Queue</CardTitle>
                <CardDescription>Scholarships submitted by organizations awaiting approval.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : pending.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">Queue Empty</h3>
                        <p className="text-muted-foreground">All caught up! No pending submissions.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pending.map(item => (
                            <div key={item._id} className="flex flex-col md:flex-row justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold">{item.title}</h4>
                                        <Badge variant="outline">{item.provider}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Submitted by {item.submittedBy?.name} • Deadline: {format(new Date(item.applicationDeadline), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-2">
                                    <Dialog open={selectedReview?._id === item._id} onOpenChange={(open) => !open && setSelectedReview(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedReview(item)}>
                                                <Eye className="h-4 w-4 mr-2" /> Review
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Review Submission</DialogTitle>
                                            </DialogHeader>
                                            {selectedReview && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold">{selectedReview.title}</h3>
                                                        <p className="text-muted-foreground">{selectedReview.provider}</p>
                                                    </div>
                                                    
                                                    <div className="bg-muted p-4 rounded-md text-sm">
                                                        <h4 className="font-semibold mb-2">Description</h4>
                                                        <p className="whitespace-pre-wrap">{selectedReview.description}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="font-semibold">Application Mode:</span> {selectedReview.applicationMode}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Deadline:</span> {format(new Date(selectedReview.applicationDeadline), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="font-semibold text-sm">Admin Notes (sent to submitter on rejection)</label>
                                                        <Textarea 
                                                            placeholder="Add reasoning for rejection or internal notes..."
                                                            value={reviewNotes}
                                                            onChange={(e) => setReviewNotes(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex justify-end gap-4 border-t pt-4">
                                                        <Button 
                                                            variant="destructive" 
                                                            onClick={() => handleReview('rejected')}
                                                            disabled={actionLoading}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                                        </Button>
                                                        <Button 
                                                            className="bg-green-600 hover:bg-green-700 text-white" 
                                                            onClick={() => handleReview('published')}
                                                            disabled={actionLoading}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Publish
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminScholarships;
