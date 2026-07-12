import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreVertical, Edit2, Trash2, ExternalLink, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ReviewFormDialog } from "@/components/colleges/ReviewFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const MyActivity = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Q&A States
  const [editItem, setEditItem] = useState<{ type: 'question' | 'answer', data: any } | null>(null);
  const [editText, setEditText] = useState("");

  // Delete States
  const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'review' | 'question' | 'answer' } | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [revRes, qRes, aRes] = await Promise.all([
        fetch(`${API_URL}/api/users/me/reviews`, { headers }),
        fetch(`${API_URL}/api/users/me/questions`, { headers }),
        fetch(`${API_URL}/api/users/me/answers`, { headers })
      ]);

      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews);
      }
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAnswers(aData.answers);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleEditSubmit = async () => {
    if (!editItem || !editText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const url = editItem.type === 'question' 
        ? `${API_URL}/api/college-qa/questions/${editItem.data._id}`
        : `${API_URL}/api/college-qa/answers/${editItem.data._id}`;

      const body = editItem.type === 'question'
        ? { questionText: editText }
        : { answerText: editText };

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(`${editItem.type === 'question' ? 'Question' : 'Answer'} updated successfully`);
      setEditItem(null);
      fetchActivity();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    try {
      const token = localStorage.getItem("token");
      let url = "";
      if (deleteItem.type === 'review') url = `${API_URL}/api/reviews/${deleteItem.id}`;
      else if (deleteItem.type === 'question') url = `${API_URL}/api/college-qa/questions/${deleteItem.id}`;
      else if (deleteItem.type === 'answer') url = `${API_URL}/api/college-qa/answers/${deleteItem.id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Item deleted successfully");
      setDeleteItem(null);
      fetchActivity();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading activity...</div>;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-xl">My Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reviews">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="answers">Answers ({answers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground mb-4">You haven't written any reviews yet.</p>
                <Link to="/college-insights">
                  <Button variant="outline">Browse Colleges</Button>
                </Link>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{review.title}</h4>
                      <Link 
                        to={`/colleges/${review.collegeId?._id}`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {review.collegeId?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-warning/20 text-warning px-2 py-0.5 rounded text-sm font-medium">
                        {review.rating} <Star className="h-3 w-3 fill-warning ml-1" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <ReviewFormDialog 
                            collegeId={review.collegeId?._id}
                            review={review}
                            onSuccess={fetchActivity}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteItem({ id: review._id, type: 'review' })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                    {review.reviewText}
                  </p>
                  <div className="text-xs text-muted-foreground mt-4">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground mb-4">You haven't asked any questions yet.</p>
                <Link to="/college-insights">
                  <Button variant="outline">Browse Colleges</Button>
                </Link>
              </div>
            ) : (
              questions.map(q => (
                <div key={q._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{q.questionText}</p>
                      <Link 
                        to={`/colleges/${q.collegeId?._id}?tab=qa`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {q.collegeId?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditItem({ type: 'question', data: q });
                          setEditText(q.questionText);
                        }}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteItem({ id: q._id, type: 'question' })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                    <span>{q.answersCount} Answers</span>
                    <span>{q.upvotes} Upvotes</span>
                    <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="answers" className="space-y-4">
            {answers.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground mb-4">You haven't answered any questions yet.</p>
                <Link to="/college-insights">
                  <Button variant="outline">Browse Colleges</Button>
                </Link>
              </div>
            ) : (
              answers.map(a => (
                <div key={a._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground italic mb-2 border-l-2 border-primary/30 pl-3">
                        "{a.questionId?.questionText}"
                      </p>
                      <p className="font-medium">{a.answerText}</p>
                      <Link 
                        to={`/colleges/${a.questionId?.collegeId?._id}?tab=qa`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        {a.questionId?.collegeId?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditItem({ type: 'answer', data: a });
                          setEditText(a.answerText);
                        }}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteItem({ id: a._id, type: 'answer' })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                    <span>{a.upvotes} Upvotes</span>
                    <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Q&A Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editItem?.type === 'question' ? 'Question' : 'Answer'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your {deleteItem?.type} from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
