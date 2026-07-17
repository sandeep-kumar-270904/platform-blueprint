import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getAttemptResults, type QuizAttempt, type Quiz, type QuizQuestion } from "@/hooks/useQuizHub";
import { Trophy, ArrowLeft, Loader2, CheckCircle2, XCircle, Info, BarChart3 } from "lucide-react";

const QuizResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<(QuizAttempt & { quiz: Quiz & { questions: QuizQuestion[] } }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    const fetchIt = async () => {
      try {
        const data = await getAttemptResults(attemptId);
        if (data) setAttempt(data as any);
      } finally {
        setLoading(false);
      }
    };
    fetchIt();
  }, [attemptId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!attempt) {
    return <div className="min-h-screen flex items-center justify-center"><p>Results not found.</p></div>;
  }

  const quiz = attempt.quiz as Quiz & { questions: QuizQuestion[] };
  const percentage = Math.round(attempt.percentageScore);
  const isPassed = percentage >= 60; // Assuming 60% is passing

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/quizzes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quizzes
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-background rounded-full shadow-sm mb-4">
            <Trophy className={`h-12 w-12 ${isPassed ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          </div>
          <h1 className="text-4xl font-bold mb-2">Quiz Completed!</h1>
          <p className="text-lg text-muted-foreground">You have finished {quiz.title}</p>
        </div>

        <Card className="mb-10 shadow-sm border-0 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Your Score</p>
                <p className="text-4xl font-bold">{attempt.score} <span className="text-xl text-muted-foreground font-normal">/ {attempt.totalPossibleScore}</span></p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Accuracy</p>
                <div className="flex flex-col items-center gap-2">
                  <p className={`text-4xl font-bold ${isPassed ? 'text-green-600' : 'text-amber-600'}`}>
                    {percentage}%
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Time Taken</p>
                <p className="text-4xl font-bold text-primary">
                  {Math.round((new Date(attempt.completedAt!).getTime() - new Date(attempt.startedAt).getTime()) / 1000)}s
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link to={`/quizzes/${quiz._id}`}>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" /> View Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6">Detailed Review</h2>
        <div className="space-y-6">
          {quiz.questions.map((q, idx) => {
            const ans = attempt.answers.find(a => a.questionIndex === idx);
            const isCorrect = ans?.isCorrect || false;
            const notAnswered = !ans || ans.selectedOptionIndex === -1;

            return (
              <Card key={idx} className={`shadow-sm border-0 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-destructive'}`}>
                <CardHeader className="pb-2 flex flex-row gap-4 items-start">
                  <div className="mt-1">
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-relaxed">
                      {idx + 1}. {q.questionText}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pl-14 pt-2">
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, optIdx) => {
                      const isUsersPick = ans?.selectedOptionIndex === optIdx;
                      const isActualCorrect = q.correctOptionIndex === optIdx;
                      
                      let bgClass = "bg-muted/30";
                      let borderClass = "border-transparent";
                      let icon = null;

                      if (isActualCorrect) {
                        bgClass = "bg-green-100 dark:bg-green-900/30";
                        borderClass = "border-green-500";
                        icon = <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto" />;
                      } else if (isUsersPick && !isActualCorrect) {
                        bgClass = "bg-red-100 dark:bg-red-900/30";
                        borderClass = "border-destructive";
                        icon = <XCircle className="h-4 w-4 text-destructive ml-auto" />;
                      }

                      return (
                        <div key={optIdx} className={`flex items-center p-3 rounded-md border ${bgClass} ${borderClass}`}>
                          <span className="font-medium mr-3 opacity-70">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                          {icon}
                        </div>
                      )
                    })}
                  </div>

                  {notAnswered && (
                    <Badge variant="destructive" className="mb-4">Not Answered</Badge>
                  )}

                  {q.explanation && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-md border border-primary/10 flex gap-3 text-sm">
                      <Info className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-muted-foreground">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
