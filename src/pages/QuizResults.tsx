import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAttemptResults, type QuizAttempt } from "@/hooks/useQuizHub";
import { Loader2, CheckCircle2, XCircle, Trophy, Clock, ArrowRight, RotateCcw, List } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { BadgeCelebrationModal } from "@/components/quiz/BadgeCelebrationModal";

const QuizResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const gamificationResult = location.state?.gamificationResult || null;
  const newBadges = gamificationResult?.newBadgesUnlocked || [];
  const [showBadgeModal, setShowBadgeModal] = useState(newBadges.length > 0);

  useEffect(() => {
    if (!attemptId) return;
    getAttemptResults(attemptId).then((res) => {
      setAttempt(res);
      setLoading(false);
    });
  }, [attemptId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Attempt not found</h2>
          <Button onClick={() => navigate('/quizzes')}>Return to Quizzes</Button>
        </div>
      </div>
    );
  }

  // Format time taken in seconds -> M:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalTimeTaken = attempt.answers?.reduce((acc, ans) => acc + (ans.timeTakenSeconds || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-2">Results</Badge>
              <h1 className="text-4xl font-bold">Quiz Completed!</h1>
              {typeof attempt.quiz === 'object' && (
                <p className="text-muted-foreground mt-2">{(attempt.quiz as any).title}</p>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {typeof attempt.quiz === 'object' && (
                <>
                  <Button variant="outline" onClick={() => navigate(`/quizzes/${(attempt.quiz as any)._id}`)}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Retake Quiz
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/quizzes/${(attempt.quiz as any)._id}/leaderboard`)}>
                    <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                  </Button>
                  <Button variant="ghost" onClick={() => navigate(`/quizzes`)}>
                    <List className="mr-2 h-4 w-4" /> All Quizzes
                  </Button>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <ScrollReveal delay={0.1}>
            <Card className="text-center h-full flex flex-col justify-center">
              <CardContent className="pt-6">
                <Trophy className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Score</h3>
                <p className="text-4xl font-bold">{Math.round(attempt.percentageScore || 0)}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {attempt.score} / {attempt.totalPossibleScore} Points
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card className="text-center h-full flex flex-col justify-center">
              <CardContent className="pt-6">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Correct</h3>
                <p className="text-4xl font-bold">
                  {attempt.answers?.filter(a => a.isCorrect).length || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  out of {attempt.answers?.length || 0} Questions
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Card className="text-center h-full flex flex-col justify-center">
              <CardContent className="pt-6">
                <Clock className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time Taken</h3>
                <p className="text-4xl font-bold">{formatTime(totalTimeTaken)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg {attempt.answers?.length ? Math.round(totalTimeTaken / attempt.answers.length) : 0}s per question
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        {attempt.status === 'abandoned' && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-md text-center">
            <h3 className="text-lg font-bold text-red-500">Attempt Abandoned</h3>
            <p className="text-muted-foreground">This attempt exceeded the time limit and was automatically submitted.</p>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Question Breakdown</h2>
        <div className="space-y-6">
          {attempt.answers?.map((ans, idx) => {
            const qSnapshot = ans.questionSnapshot as any;
            if (!qSnapshot) return null;
            
            return (
              <ScrollReveal key={idx} delay={0.05 * idx}>
                <Card className={`border-l-4 ${ans.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                        {qSnapshot.text}
                      </CardTitle>
                      <Badge variant={ans.isCorrect ? "default" : "destructive"}>
                        {ans.isCorrect ? '+' : '0'} {qSnapshot.points || 1} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mt-4">
                      {qSnapshot.options?.map((opt: string, optIdx: number) => {
                        let bgColor = "bg-secondary/20";
                        let borderColor = "border-border";
                        let icon = null;
                        
                        if (optIdx === qSnapshot.correctIndex) {
                          bgColor = "bg-green-500/10";
                          borderColor = "border-green-500/50";
                          icon = <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />;
                        } else if (optIdx === ans.selectedOptionIndex && !ans.isCorrect) {
                          bgColor = "bg-red-500/10";
                          borderColor = "border-red-500/50";
                          icon = <XCircle className="h-4 w-4 text-red-500 ml-auto" />;
                        }
                        
                        return (
                          <div 
                            key={optIdx} 
                            className={`flex items-center p-3 rounded-md border ${bgColor} ${borderColor}`}
                          >
                            <span className="font-medium mr-3">{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{opt}</span>
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!ans.isCorrect && qSnapshot.explanation && (
                      <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">Explanation</h4>
                        <p className="text-sm">{qSnapshot.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
      <BadgeCelebrationModal 
        isOpen={showBadgeModal} 
        onClose={() => setShowBadgeModal(false)} 
        badges={newBadges} 
      />
    </div>
  );
};

export default QuizResults;
