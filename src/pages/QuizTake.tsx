import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { startAttempt, submitAttempt, type Quiz, type QuizQuestion, type QuizAttempt } from "@/hooks/useQuizHub";
import { Clock, Loader2, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";

const QuizTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<(Quiz & { questions: QuizQuestion[] }) | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selectedOptionIndex: number; timeTakenSeconds: number }>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      try {
        const res = await startAttempt(id);
        setQuiz(res.quiz);
        setAttempt(res.attempt);
        
        // Restore answers if resuming
        if (res.attempt.answers && res.attempt.answers.length > 0) {
          const restored: any = {};
          res.attempt.answers.forEach(a => {
            restored[a.questionIndex] = {
              selectedOptionIndex: a.selectedOptionIndex,
              timeTakenSeconds: a.timeTakenSeconds || 0
            };
          });
          setAnswers(restored);
        }
      } catch (err: any) {
        toast.error(err.message);
        navigate('/quizzes');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, navigate]);

  useEffect(() => {
    if (!attempt || !quiz) return;
    
    const calculateTimeLeft = () => {
      const allowedTimeMs = quiz.durationMinutes * 60 * 1000;
      const startedAtMs = new Date(attempt.startedAt).getTime();
      const nowMs = Date.now();
      const remainingMs = allowedTimeMs - (nowMs - startedAtMs);
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, quiz]);

  const handleSelectOption = (optIdx: number) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    setAnswers(prev => ({
      ...prev,
      [currentQIdx]: {
        selectedOptionIndex: optIdx,
        timeTakenSeconds: (prev[currentQIdx]?.timeTakenSeconds || 0) + timeSpent
      }
    }));
    questionStartTime.current = Date.now();
  };

  const handleNext = () => {
    if (quiz && currentQIdx < quiz.questions.length - 1) {
      setCurrentQIdx(c => c + 1);
      questionStartTime.current = Date.now();
    }
  };

  const handlePrev = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx(c => c - 1);
      questionStartTime.current = Date.now();
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!attempt) return;
    if (submitting) return; // prevent double submit
    
    if (autoSubmit) {
      toast.info("Time is up! Submitting your answers automatically.");
    } else {
      if (!window.confirm("Are you sure you want to submit your quiz?")) return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qIdx, ans]) => ({
        questionIndex: parseInt(qIdx),
        selectedOptionIndex: ans.selectedOptionIndex,
        timeTakenSeconds: ans.timeTakenSeconds
      }));
      
      await submitAttempt(attempt._id, formattedAnswers);
      toast.success("Quiz submitted successfully!");
      navigate(`/attempts/${attempt._id}/results`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz || timeLeft === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const currentQ = quiz.questions[currentQIdx];
  const progress = ((Object.keys(answers).length) / quiz.questions.length) * 100;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLastQuestion = currentQIdx === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-lg truncate max-w-[50%]">{quiz.title}</h1>
          
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-md ${timeLeft < 60 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="mb-6 flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>Question {currentQIdx + 1} of {quiz.questions.length}</span>
          <span>{Object.keys(answers).length} Answered</span>
        </div>

        <Card className="flex-1 shadow-sm border-0 mb-6 relative overflow-hidden">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <CardTitle className="text-xl leading-relaxed font-semibold">
              {currentQ.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQIdx]?.selectedOptionIndex === idx;
                return (
                  <Button
                    key={idx}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto py-4 px-6 text-base whitespace-normal ${isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
                    onClick={() => handleSelectOption(idx)}
                  >
                    <div className="flex gap-4">
                      <span className="font-bold opacity-70 mt-0.5">{String.fromCharCode(65 + idx)}.</span>
                      <span>{opt}</span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handlePrev} 
            disabled={currentQIdx === 0}
            className="w-32"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {!isLastQuestion ? (
            <Button 
              size="lg" 
              onClick={handleNext}
              className="w-32"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="w-32 bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
