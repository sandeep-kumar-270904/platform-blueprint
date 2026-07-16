import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Question {
  _id: string;
  questionText: string;
  options: string[];
}

interface Assessment {
  _id: string;
  skill: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScorePercent: number;
  questionCount: number;
  canAttempt: boolean;
  nextEligibleDate?: string;
  latestAttempt?: {
    score: number;
    passed: boolean;
    completedAt: string;
  };
}

export default function Assessments() {
  const queryClient = useQueryClient();
  const [activeTest, setActiveTest] = useState<{ _id: string, title: string, durationMinutes: number, questions: Question[] } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ['assessments'],
    queryFn: async () => {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/api/assessments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return res.json();
    }
  });

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`http://localhost:5000/api/assessments/${id}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to start');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setActiveTest(data);
      setCurrentQuestionIndex(0);
      setAnswers(new Array(data.questions.length).fill(-1));
      setTimeLeft(data.durationMinutes * 60);
      
      // Basic timer interval
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitTest(data._id); // auto-submit when time expires
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const submitMutation = useMutation({
    mutationFn: async ({ id, answersPayload }: { id: string, answersPayload: number[] }) => {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`http://localhost:5000/api/assessments/${id}/submit`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersPayload })
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.passed ? `Passed! Score: ${data.score}%` : `Failed. Score: ${data.score}%`);
      setActiveTest(null);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    }
  });

  const submitTest = (testId: string) => {
    // If not triggered by timer, use current answers state. 
    // In React state updates inside intervals can be tricky, but here we just pass the current answers state since this is triggered by the user normally.
    submitMutation.mutate({ id: testId, answersPayload: answers });
  };

  if (isLoading) return <div className="p-8">Loading assessments...</div>;

  if (activeTest) {
    const q = activeTest.questions[currentQuestionIndex];
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{activeTest.title}</h1>
          <div className="text-lg font-semibold text-red-500">
            Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1} of {activeTest.questions.length}</CardTitle>
            <CardDescription className="text-lg text-foreground mt-4">{q.questionText}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options.map((opt, i) => (
              <div 
                key={i}
                onClick={() => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestionIndex] = i;
                  setAnswers(newAnswers);
                }}
                className={`p-4 border rounded cursor-pointer transition-colors ${answers[currentQuestionIndex] === i ? 'bg-primary/10 border-primary' : 'hover:bg-accent'}`}
              >
                {opt}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            {currentQuestionIndex === activeTest.questions.length - 1 ? (
              <Button onClick={() => submitTest(activeTest._id)} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestionIndex(p => Math.min(activeTest.questions.length - 1, p + 1))}>
                Next
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Skill Assessments</h1>
      <p className="text-muted-foreground mb-8">Take assessments to earn verified skill badges and stand out to recruiters.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments?.map(a => (
          <Card key={a._id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{a.title}</CardTitle>
                {a.latestAttempt?.passed && (
                  <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                )}
              </div>
              <CardDescription>{a.skill}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">{a.description}</p>
              <div className="text-sm space-y-1">
                <p>⏳ {a.durationMinutes} Minutes</p>
                <p>📝 {a.questionCount} Questions</p>
                <p>🎯 Passing: {a.passingScorePercent}%</p>
              </div>
              
              {a.latestAttempt && (
                <div className="mt-4 p-3 bg-accent rounded text-sm">
                  <p>Latest Score: <strong>{a.latestAttempt.score}%</strong></p>
                  <p>Status: {a.latestAttempt.passed ? <span className="text-green-600">Passed</span> : <span className="text-red-600">Failed</span>}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {a.canAttempt ? (
                <Button 
                  className="w-full" 
                  onClick={() => startMutation.mutate(a._id)}
                  disabled={startMutation.isPending}
                >
                  {a.latestAttempt ? 'Retake Assessment' : 'Start Assessment'}
                </Button>
              ) : (
                <Button className="w-full" variant="secondary" disabled>
                  Available on {new Date(a.nextEligibleDate!).toLocaleDateString()}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
        {assessments?.length === 0 && (
          <p>No active assessments available.</p>
        )}
      </div>
    </div>
  );
}
