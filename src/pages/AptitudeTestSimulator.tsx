import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Clock, AlertTriangle, ArrowLeft, Loader2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export default function AptitudeTestSimulator() {
  const [searchParams] = useSearchParams();
  const defId = searchParams.get('defId');
  const navigate = useNavigate();

  const [hasStarted, setHasStarted] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  
  // Test State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${API_URL}/api/aptitude/test/start`, { definitionId: defId }, { headers: getAuthHeaders() });
      return res.data;
    },
    onSuccess: (data) => {
      setTestData(data);
      // Calculate remaining seconds based on server expiresAt
      const remainingSeconds = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
      
      // Find the first unanswered question if resuming
      let firstUnanswered = 0;
      for (let i = 0; i < data.responses.length; i++) {
        if (data.responses[i].selectedAnswer === null) {
          firstUnanswered = i;
          break;
        }
      }
      
      if (!data.allowBackwardNavigation && firstUnanswered > 0) {
        setCurrentIndex(firstUnanswered);
      }
      
      if (data.responses[currentIndex]?.selectedAnswer !== null) {
        setSelectedOption(data.responses[currentIndex]?.selectedAnswer);
      }

      setHasStarted(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate mock test.');
    }
  });

  const answerMutation = useMutation({
    mutationFn: async (payload: { attemptId: string, questionId: string, selectedAnswer: number | null }) => {
      const res = await axios.post(`${API_URL}/api/aptitude/test/answer`, payload, { headers: getAuthHeaders() });
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = { attemptId: testData.attemptId };
      const res = await axios.post(`${API_URL}/api/aptitude/test/submit`, payload, { headers: getAuthHeaders() });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Test submitted successfully!");
      navigate(`/placement/aptitude/test/results/${data.resultId}`);
    },
    onError: () => {
      toast.error("Failed to submit test.");
    }
  });

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (hasStarted && timeLeft > 0 && !submitMutation.isPending) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitMutation.mutate(); // Auto-submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, submitMutation.isPending]);

  const handleStart = () => {
    if (!defId) {
      toast.error("Test definition not specified.");
      return;
    }
    generateMutation.mutate();
  };

  const handleOptionSelect = (index: number) => {
    if (submitMutation.isPending) return;
    
    // In strict navigation mode, you cannot change answer once confirmed via "Next". 
    // Here we allow changing selection BEFORE hitting Next.
    setSelectedOption(index);
  };

  const handleNext = async () => {
    const qId = testData.responses[currentIndex]._id;
    
    // Only fire the answer mutation if an answer is selected. If skipped, we can optionally log a skip or leave it null.
    if (selectedOption !== null) {
      await answerMutation.mutateAsync({ attemptId: testData.attemptId, questionId: qId, selectedAnswer: selectedOption });
    }

    // Update local state
    const newResponses = [...testData.responses];
    newResponses[currentIndex].selectedAnswer = selectedOption;
    setTestData({ ...testData, responses: newResponses });

    if (currentIndex === testData.responses.length - 1) {
      submitMutation.mutate();
    } else {
      setCurrentIndex(prev => prev + 1);
      
      const nextAnswer = testData.responses[currentIndex + 1].selectedAnswer;
      setSelectedOption(nextAnswer);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Pre-start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16 max-w-3xl">
          <Button variant="ghost" className="mb-8 -ml-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center pb-8 pt-12">
              <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl mb-2">Aptitude Test</CardTitle>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ready to evaluate your skills?
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Format</div>
                  <div className="font-medium flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary"/> Multiple Choice</div>
                </div>
                <div className="hidden md:block w-px h-12 bg-border"></div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Time Limit</div>
                  <div className="font-medium">Strictly Enforced</div>
                </div>
                <div className="hidden md:block w-px h-12 bg-border"></div>
                <div className="text-center md:text-right">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Scoring</div>
                  <div className="font-medium">With Percentiles</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-500 rounded-md border border-yellow-200 dark:border-yellow-900/50">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Important Instructions:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>The timer cannot be paused once started.</li>
                    <li>Ensure you have a stable internet connection.</li>
                    <li>If you disconnect, you can resume the test as long as time remains.</li>
                    <li>The test will auto-submit when the timer reaches zero.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-8 flex justify-center">
              <Button size="lg" className="w-full max-w-sm" onClick={handleStart} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Start Test Now
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  // 2. Active Test Screen
  const currentQuestion = testData.responses[currentIndex];
  const isStrictNavigation = !testData.allowBackwardNavigation;
  const isLocked = isStrictNavigation && currentQuestion.selectedAnswer !== null && currentQuestion.selectedAnswer !== undefined && currentQuestion.selectedAnswer !== selectedOption;
  // Note: Once "Next" is clicked in strict nav, the selection is saved to testData.responses. 
  // Wait, if it's strictly navigating, they can't go back anyway so they can't see the locked state.
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Test Header */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm py-3 px-4 md:px-8 flex justify-between items-center">
        <div className="font-bold text-lg hidden md:block">Test Simulation</div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md font-mono text-xl font-bold">
            <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
            <span className={timeLeft < 300 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
          </div>
          <Button variant="destructive" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
            Submit Test
          </Button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col lg:flex-row gap-8">
        
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline" className="text-sm">Question {currentIndex + 1} of {testData.responses.length}</Badge>
            <Badge>{currentQuestion.category}</Badge>
          </div>
          
          <Card className="flex-1 shadow-sm border-primary/10 mb-6">
            <CardHeader className="bg-muted/30 border-b pb-6">
              <CardTitle className="text-xl md:text-2xl leading-relaxed font-medium">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                {currentQuestion.options.map((option: string, idx: number) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <Button 
                      key={idx} 
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-5 px-6 text-base font-normal whitespace-normal transition-all ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={answerMutation.isPending || (isStrictNavigation && testData.responses[currentIndex].selectedAnswer !== null)}
                    >
                      <span className={`mr-4 font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="flex-1">{option}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            {isStrictNavigation ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4"/> 
                Backward navigation is disabled.
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentIndex(p => p - 1);
                  setSelectedOption(testData.responses[currentIndex - 1]?.selectedAnswer);
                }} 
                disabled={currentIndex === 0 || answerMutation.isPending}
              >
                Previous
              </Button>
            )}
            
            <Button 
              className={isStrictNavigation ? "ml-auto" : ""}
              onClick={handleNext} 
              disabled={answerMutation.isPending}
            >
              {answerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {currentIndex === testData.responses.length - 1 ? "Submit Test" : "Save & Next"}
            </Button>
          </div>
        </div>

        {/* Sidebar Grid Navigation (Hide if strict navigation) */}
        {!isStrictNavigation && (
          <div className="w-full lg:w-72 shrink-0">
            <Card className="sticky top-24">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {testData.responses.map((q: any, i: number) => {
                    const isAnswered = q.selectedAnswer !== null;
                    const isCurrent = i === currentIndex;
                    
                    let btnClass = "w-10 h-10 p-0 text-sm font-medium ";
                    if (isCurrent) {
                      btnClass += "ring-2 ring-offset-2 ring-primary ";
                    }
                    
                    if (isAnswered) {
                      btnClass += "bg-primary text-primary-foreground hover:bg-primary/90";
                    } else {
                      btnClass += "bg-muted text-muted-foreground hover:bg-muted/80";
                    }

                    return (
                      <Button
                        key={q._id}
                        variant="ghost"
                        className={btnClass}
                        onClick={() => {
                          setCurrentIndex(i);
                          setSelectedOption(testData.responses[i].selectedAnswer);
                        }}
                        disabled={answerMutation.isPending}
                      >
                        {i + 1}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
