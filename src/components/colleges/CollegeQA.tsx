import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, MessageSquare, ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const CollegeQA = ({ collegeId }: { collegeId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("upvotes");
  
  // Expanded state keeps track of which questions have their answers shown
  const [expandedQs, setExpandedQs] = useState<Record<string, boolean>>({});
  const [answersCache, setAnswersCache] = useState<Record<string, any[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});

  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);
  const [qDialogOpen, setQDialogOpen] = useState(false);

  const [newAnswer, setNewAnswer] = useState("");
  const [submittingA, setSubmittingA] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/colleges/${collegeId}/questions?sort=${sort}&limit=20`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [collegeId, sort]);

  const toggleExpand = async (qId: string) => {
    const isExpanding = !expandedQs[qId];
    setExpandedQs(prev => ({ ...prev, [qId]: isExpanding }));

    if (isExpanding && !answersCache[qId]) {
      setLoadingAnswers(prev => ({ ...prev, [qId]: true }));
      try {
        const res = await fetch(`${API_URL}/api/college-qa/questions/${qId}/answers`);
        const data = await res.json();
        setAnswersCache(prev => ({ ...prev, [qId]: data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAnswers(prev => ({ ...prev, [qId]: false }));
      }
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSubmittingQ(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/colleges/${collegeId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ questionText: newQuestion })
      });
      if (res.ok) {
        setNewQuestion("");
        setQDialogOpen(false);
        fetchQuestions();
        toast({ title: "Question posted successfully" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingQ(false);
    }
  };

  const handlePostAnswer = async (qId: string) => {
    if (!newAnswer.trim()) return;
    setSubmittingA(qId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/college-qa/questions/${qId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answerText: newAnswer })
      });
      if (res.ok) {
        const answer = await res.json();
        setNewAnswer("");
        // Update cache locally
        setAnswersCache(prev => ({
          ...prev,
          [qId]: [answer, ...(prev[qId] || [])]
        }));
        
        // Ensure expanded
        if (!expandedQs[qId]) {
          setExpandedQs(prev => ({ ...prev, [qId]: true }));
        }

        toast({ title: "Answer posted successfully" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingA(null);
    }
  };

  const handleUpvoteQ = async (qId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return toast({ title: "Please login to vote", variant: "destructive" });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/college-qa/questions/${qId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(prev => prev.map(q => q._id === qId ? { ...q, upvotes: data.upvotes } : q));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteA = async (aId: string, qId: string) => {
    if (!user) return toast({ title: "Please login to vote", variant: "destructive" });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/college-qa/answers/${aId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnswersCache(prev => ({
          ...prev,
          [qId]: prev[qId].map(a => a._id === aId ? { ...a, upvotes: data.upvotes } : a)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button 
            variant={sort === "upvotes" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSort("upvotes")}
          >
            Most Upvoted
          </Button>
          <Button 
            variant={sort === "recent" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSort("recent")}
          >
            Most Recent
          </Button>
          <Button 
            variant={sort === "unanswered" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSort("unanswered")}
          >
            Unanswered
          </Button>
        </div>
        
        <Dialog open={qDialogOpen} onOpenChange={(open) => {
          if (!user && open) {
             toast({ title: "Please login to ask a question", variant: "destructive" });
             return;
          }
          setQDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button><MessageSquare className="mr-2 h-4 w-4" /> Ask a Question</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                Ask current students or alumni about life at this college, courses, placements, and more.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
              placeholder="What would you like to know?" 
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[100px] mt-4"
            />
            <div className="flex justify-end mt-4">
              <Button onClick={handleAskQuestion} disabled={!newQuestion.trim() || submittingQ}>
                {submittingQ ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No questions yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to ask a question about this college!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q._id} className="border-border overflow-hidden">
              <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => toggleExpand(q._id)}
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full" 
                      onClick={(e) => handleUpvoteQ(q._id, e)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{q.upvotes}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{q.questionText}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {q.askedBy?.full_name?.charAt(0) || 'U'}
                      </div>
                      <span>{q.askedBy?.full_name || 'Anonymous User'}</span>
                      <span>•</span>
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{q.status === 'answered' ? 'Answered' : 'Unanswered'}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 pt-2">
                    {expandedQs[q._id] ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
              </div>
              
              {expandedQs[q._id] && (
                <div className="bg-muted/10 p-4 sm:p-6 border-t border-border">
                  {loadingAnswers[q._id] ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="space-y-6">
                      {(answersCache[q._id] || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No answers yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {answersCache[q._id].map(a => (
                            <div key={a._id} className="flex gap-4 border-l-2 border-primary/20 pl-4 py-1">
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full" 
                                  onClick={() => handleUpvoteA(a._id, q._id)}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-medium">{a.upvotes}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm mb-2">{a.answerText}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span>{a.answeredBy?.full_name || 'Anonymous User'}</span>
                                  {a.isCurrentStudent && (
                                    <Badge variant="secondary" className="text-[10px] h-4 py-0">Current Student / Alumni</Badge>
                                  )}
                                  <span>•</span>
                                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {user ? (
                        <div className="mt-4 pt-4 border-t border-border">
                          <Textarea 
                            placeholder="Write an answer..." 
                            value={submittingA === q._id ? "" : newAnswer}
                            onChange={(e) => {
                              if (submittingA !== q._id) setNewAnswer(e.target.value);
                            }}
                            className="min-h-[80px] mb-2 text-sm"
                          />
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              onClick={() => handlePostAnswer(q._id)}
                              disabled={!newAnswer.trim() || submittingA === q._id}
                            >
                              {submittingA === q._id ? "Posting..." : "Post Answer"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Log in to write an answer.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
