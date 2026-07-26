import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getQuiz, getLeaderboard, startAttempt, reportQuiz, subscribeToQuiz, unsubscribeFromQuiz, type Quiz } from "@/hooks/useQuizHub";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Clock, Target, Play, ArrowLeft, Loader2, Info, Flag, Users, Bell, BellRing, Swords } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleAppeal = async (attemptId: string) => {
    try {
      await api.post(`/attempts/${attemptId}/appeal`);
      toast.success('Appeal submitted successfully.');
      // Refresh logic would go here
    } catch (e: any) {
      toast.error('Failed to submit appeal.');
    }
  };
  
  const handleReportQuestion = async (questionIndex: number) => {
    const reason = window.prompt("Why is this question incorrect?");
    if (!reason) return;
    try {
      await api.post(`/quizzes/${id}/dispute`, { questionIndex, reason });
      toast.success('Question reported for review.');
    } catch (e) {
      toast.error('Failed to report question.');
    }
  };

  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  
  // Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  
  // Subscribing
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Challenge State
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [challenging, setChallenging] = useState(false);

  const fetchConnections = async () => {
    try {
      const res = await api.get('/challenges/connections');
      // filter only accepted connections
      setConnections(res.data.filter((c: any) => c.status === 'accepted'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleIssueChallenge = async () => {
    if (!selectedConnection) return;
    setChallenging(true);
    try {
      await api.post('/challenges', { challengedId: selectedConnection, quizId: id });
      toast.success("Challenge sent!");
      setChallengeOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Error sending challenge");
    } finally {
      setChallenging(false);
    }
  };


  useEffect(() => {
    if (!id) return;
    const fetchIt = async () => {
      try {
        const q = await getQuiz(id);
        if (q) {
          setQuiz(q);
          const lb = await getLeaderboard(id);
          setLeaderboard(lb);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchIt();
  }, [id]);

  useEffect(() => {
    if (quiz && user) {
      // Basic check if it's in their profile, though auth context might need a refresh to stay perfectly in sync.
      setIsSubscribed((user as any).subscribedQuizzes?.includes(quiz._id) || false);
    }
  }, [quiz, user]);


  useEffect(() => {
    if (challengeOpen) fetchConnections();
  }, [challengeOpen]);

  const handleStart = async () => {
    if (!user) {
      toast.error("Please login to take quizzes");
      return;
    }
    setStarting(true);
    try {
      const { attempt } = await startAttempt(quiz!._id);
      navigate(`/quizzes/${quiz!._id}/take`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStarting(false);
    }
  };
  
  const handleHost = () => {
    navigate(`/quizzes/${quiz!._id}/host`);
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }
    setReporting(true);
    try {
      await reportQuiz(quiz!._id, reportReason, reportDetails);
      toast.success("Quiz reported. Thank you for your feedback.");
      setReportOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReporting(false);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!user) {
      toast.error("Please login to subscribe");
      return;
    }
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromQuiz(quiz!._id);
        setIsSubscribed(false);
        toast.success("Unsubscribed from quiz updates");
      } else {
        await subscribeToQuiz(quiz!._id);
        setIsSubscribed(true);
        toast.success("Subscribed to quiz updates");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!quiz) {
    return <div className="min-h-screen flex items-center justify-center"><p>Quiz not found.</p></div>;
  }

  const isCreator = user && quiz.createdBy === user._id;
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/quizzes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quizzes
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm relative">
              <CardContent className="pt-8 space-y-6">
                
                {/* Top-right Actions (Report) */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {quiz.status === 'under_review' && (
                    <Badge variant="destructive">Under Review</Badge>
                  )}
                  {user && !isCreator && (
                    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Report Quiz" className="text-muted-foreground hover:text-destructive">
                          <Flag className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report Quiz</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Reason</label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="incorrect_answers">Incorrect Answers</SelectItem>
                                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                                <SelectItem value="spam">Spam / Low Quality</SelectItem>
                                <SelectItem value="plagiarism">Plagiarism</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Additional Details (Optional)</label>
                            <Textarea 
                              value={reportDetails}
                              onChange={(e) => setReportDetails(e.target.value)}
                              placeholder="Provide more context to help us review..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleReport} disabled={reporting}>
                            {reporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Submit Report
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline">{quiz.category}</Badge>
                        {quiz.isAIGenerated && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI-generated
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-bold pr-12">{quiz.title}</h1>
                    </div>
                    {user && !isCreator && (
                      <Button 
                        variant={isSubscribed ? "secondary" : "outline"} 
                        size="sm" 
                        onClick={handleToggleSubscribe}
                        disabled={subscribing}
                        className="mt-1 flex-shrink-0"
                      >
                        {subscribing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : isSubscribed ? (
                          <BellRing className="h-4 w-4 mr-2 text-primary" />
                        ) : (
                          <Bell className="h-4 w-4 mr-2" />
                        )}
                        {isSubscribed ? "Subscribed" : "Notify Me"}
                      </Button>
                    )}
                  </div>
                  
                  {quiz.description && (
                    <p className="text-lg text-muted-foreground">{quiz.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><Target className="h-4 w-4" /> Questions</span>
                    <p className="font-semibold text-lg">{quiz.question_count}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> Duration</span>
                    <p className="font-semibold text-lg">{quiz.durationMinutes} min</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><Info className="h-4 w-4" /> Difficulty</span>
                    <p className="font-semibold text-lg capitalize">{quiz.difficulty}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><Trophy className="h-4 w-4" /> Avg Score</span>
                    <p className="font-semibold text-lg">{Math.round(quiz.averageScore)}%</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="flex-1 text-lg h-14" onClick={handleStart} disabled={starting || quiz.question_count === 0}>
                    {starting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {starting ? "Starting..." : "Practice Solo"}
                  </Button>
                  
                  {(isCreator || isAdmin) && quiz.mode === 'live' && (
                    <Button size="lg" variant="secondary" className="flex-1 text-lg h-14 bg-indigo-100 text-indigo-700 hover:bg-indigo-200" onClick={handleHost}>
                      <Users className="h-5 w-5 mr-2" />
                      Host Live Session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="h-full border-0 shadow-sm bg-gradient-to-b from-card to-muted/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Solo Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No attempts yet. Be the first to score!
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {leaderboard.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold w-5 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{entry.userInfo.full_name || entry.userInfo.username}</p>
                            <p className="text-xs text-muted-foreground">{Math.round(entry.durationMs / 1000)}s</p>
                          </div>
                        </div>
                        <div className="font-bold text-primary">
                          {Math.round(entry.bestScore)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
