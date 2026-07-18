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
  const [answers, setAnswers] = useState<Record<number, { selectedOptionIndex: number; timeTakenSeconds: number; isCorrect?: boolean }>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Adaptive mode state
  const [askedQuestions, setAskedQuestions] = useState<Set<number>>(new Set([0]));
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [showExplanation, setShowExplanation] = useState(false);

  // Sectioned mode state
  const [flatQuestions, setFlatQuestions] = useState<any[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number | null>(null);

  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      try {
        const res = await startAttempt(id);
        setQuiz(res.quiz);
        setAttempt(res.attempt);
        
        let allQ: any[] = [];
        if (res.quiz.mode === 'sectioned_exam' && res.quiz.sections?.length > 0) {
          res.quiz.sections.forEach((s: any) => {
            if (s.questions) allQ.push(...s.questions);
          });
          setSectionTimeLeft(res.quiz.sections[0].timeLimitSeconds || 600);
        } else {
          allQ = res.quiz.questions || [];
        }
        setFlatQuestions(allQ);
        
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
      
      if (quiz.mode === 'sectioned_exam') {
        setSectionTimeLeft(prev => {
          if (prev !== null && prev <= 0) {
            // Auto advance section
            const sections = quiz.sections || [];
            if (currentSectionIdx < sections.length - 1) {
              const nextSec = currentSectionIdx + 1;
              setCurrentSectionIdx(nextSec);
              // Calculate index of first question in next section
              let idx = 0;
              for(let i=0; i<nextSec; i++) {
                idx += sections[i].questions?.length || 0;
              }
              setCurrentQIdx(idx);
              toast.info(`Time's up for this section! Moving to next section.`);
              return sections[nextSec].timeLimitSeconds || 600;
            } else {
              clearInterval(timer);
              handleSubmit(true);
              return 0;
            }
          }
          return prev !== null ? prev - 1 : null;
        });
      }
      
      if (remaining <= 0 && quiz.mode !== 'sectioned_exam') {
        clearInterval(timer);
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, quiz, currentSectionIdx]);

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
    if (!quiz) return;

    if (quiz.mode === 'adaptive_practice') {
      const isCorrect = answers[currentQIdx]?.isCorrect;
      let nextDiff = currentDifficulty;
      if (isCorrect) {
        nextDiff = currentDifficulty === 'easy' ? 'medium' : 'hard';
      } else {
        nextDiff = currentDifficulty === 'hard' ? 'medium' : 'easy';
      }
      setCurrentDifficulty(nextDiff);

      // Find an unasked question with matching difficulty
      let candidates = quiz.questions.map((q, i) => ({ i, q }))
        .filter(({ i, q }) => !askedQuestions.has(i) && (q.calibratedDifficulty || q.authorDifficulty || 'medium') === nextDiff);
      
      if (candidates.length === 0) {
        // Fallback to any unasked
        candidates = quiz.questions.map((q, i) => ({ i, q })).filter(({ i }) => !askedQuestions.has(i));
      }

      if (candidates.length > 0) {
        const nextIdx = candidates[Math.floor(Math.random() * candidates.length)].i;
        setAskedQuestions(prev => new Set(prev).add(nextIdx));
        setCurrentQIdx(nextIdx);
        setShowExplanation(false);
        questionStartTime.current = Date.now();
      } else {
        // Run out of questions
        handleSubmit(false);
      }
    } else {
      if (currentQIdx < flatQuestions.length - 1) {
        if (quiz.mode === 'sectioned_exam') {
          // Prevent moving beyond current section manually
          const sections = quiz.sections || [];
          let currentSectionEndIdx = -1;
          for(let i=0; i<=currentSectionIdx; i++) {
            currentSectionEndIdx += sections[i].questions?.length || 0;
          }
          if (currentQIdx >= currentSectionEndIdx) {
            toast.warning("You must wait for the section time to expire before moving on.");
            return;
          }
        }
        
        setCurrentQIdx(c => c + 1);
        questionStartTime.current = Date.now();
      }
    }
  };

  const handlePrev = () => {
    if (quiz?.mode === 'adaptive_practice') return; // Cannot go back in adaptive
    if (quiz?.mode === 'sectioned_exam') {
      // Prevent going back to previous section
      const sections = quiz?.sections || [];
      let currentSectionStartIdx = 0;
      for(let i=0; i<currentSectionIdx; i++) {
        currentSectionStartIdx += sections[i].questions?.length || 0;
      }
      if (currentQIdx <= currentSectionStartIdx) {
        toast.warning("You cannot return to a previous section.");
        return;
      }
    }
    
    if (currentQIdx > 0) {
      setCurrentQIdx(c => c - 1);
      questionStartTime.current = Date.now();
    }
  };

  const handleCheckAnswer = () => {
    if (!quiz || quiz.mode !== 'adaptive_practice') return;
    const ans = answers[currentQIdx];
    if (!ans) return;
    const correctIdx = flatQuestions[currentQIdx].correctOptionIndex;
    setAnswers(prev => ({
      ...prev,
      [currentQIdx]: {
        ...prev[currentQIdx],
        isCorrect: ans.selectedOptionIndex === correctIdx
      }
    }));
    setShowExplanation(true);
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

  if (loading || !quiz || timeLeft === null || flatQuestions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const currentQ = flatQuestions[currentQIdx];
  const progress = ((Object.keys(answers).length) / flatQuestions.length) * 100;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLastQuestion = currentQIdx === flatQuestions.length - 1;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-lg truncate max-w-[50%]">{quiz.title}</h1>
          
          <div className="flex items-center gap-4">
            {quiz.mode === 'sectioned_exam' && sectionTimeLeft !== null && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Section Time</span>
                <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-md ${sectionTimeLeft < 30 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'}`}>
                  <Clock className="h-4 w-4" />
                  {formatTime(sectionTimeLeft)}
                </div>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Time</span>
              <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-md ${timeLeft < 60 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'}`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="mb-6 flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>Question {currentQIdx + 1} of {flatQuestions.length}</span>
          <span>{Object.keys(answers).length} Answered</span>
        </div>

        <Card className="flex-1 shadow-sm border-0 mb-6 relative overflow-hidden">
          <CardHeader className="pb-4 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-xl leading-relaxed font-semibold">
              {currentQ.questionText}
            </CardTitle>
            {quiz.mode === 'adaptive_practice' && (
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                Tier: {currentDifficulty}
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQIdx]?.selectedOptionIndex === idx;
                const isCorrectOpt = showExplanation && idx === currentQ.correctOptionIndex;
                const isWrongSelected = showExplanation && isSelected && idx !== currentQ.correctOptionIndex;
                
                let btnClass = `w-full justify-start text-left h-auto py-4 px-6 text-base whitespace-normal ${isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`;
                if (showExplanation) {
                  if (isCorrectOpt) btnClass += ' bg-green-100 border-green-500 text-green-900';
                  else if (isWrongSelected) btnClass += ' bg-red-100 border-red-500 text-red-900';
                  else btnClass += ' opacity-50';
                }

                return (
                  <Button
                    key={idx}
                    variant={isSelected && !showExplanation ? "default" : "outline"}
                    className={btnClass}
                    onClick={() => !showExplanation && handleSelectOption(idx)}
                    disabled={showExplanation}
                  >
                    <div className="flex gap-4">
                      <span className="font-bold opacity-70 mt-0.5">{String.fromCharCode(65 + idx)}.</span>
                      <span>{opt}</span>
                    </div>
                  </Button>
                )
              })}
            </div>

            {showExplanation && (
              <div className="mt-6 p-4 bg-muted/50 rounded-md border text-sm">
                <p className="font-semibold mb-1">
                  {answers[currentQIdx]?.isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                </p>
                {currentQ.explanation && <p className="text-muted-foreground">{currentQ.explanation}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          {quiz.mode !== 'adaptive_practice' ? (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handlePrev} 
              disabled={currentQIdx === 0}
              className="w-32"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          ) : <div></div>}

          {quiz.mode === 'adaptive_practice' && !showExplanation ? (
            <Button 
              size="lg" 
              onClick={handleCheckAnswer}
              disabled={answers[currentQIdx] === undefined}
              className="w-32 bg-blue-600 hover:bg-blue-700"
            >
              Check
            </Button>
          ) : !isLastQuestion || (quiz.mode === 'adaptive_practice' && askedQuestions.size < flatQuestions.length) ? (
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
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
