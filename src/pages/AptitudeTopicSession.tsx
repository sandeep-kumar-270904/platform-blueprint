import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export default function AptitudeTopicSession() {
  const { category, topic } = useParams();
  const navigate = useNavigate();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, correctAnswer: number, explanation: string } | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['aptitudePractice', category, topic],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/aptitude/practice?category=${category}&topic=${encodeURIComponent(topic || '')}&unattempted=true`, { headers: getAuthHeaders() });
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { questionId: string, selectedAnswer: number }) => {
      const res = await axios.post(`${API_URL}/api/aptitude/practice/submit`, payload, { headers: getAuthHeaders() });
      return res.data;
    },
    onSuccess: (data) => {
      setFeedback(data);
    },
    onError: () => {
      toast.error("Failed to submit answer.");
      setSelectedOption(null);
    }
  });

  const handleOptionSelect = (index: number) => {
    if (feedback || submitMutation.isPending) return; // Prevent changing answer after submission or while loading
    setSelectedOption(index);
    submitMutation.mutate({ questionId: currentQuestion._id, selectedAnswer: index });
  };

  const handleNext = () => {
    setFeedback(null);
    setSelectedOption(null);
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0 || currentIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16 max-w-3xl text-center">
          <Button variant="ghost" className="mb-8 self-start" onClick={() => navigate('/placement/aptitude')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="bg-muted/30 border rounded-xl p-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Session Complete!</h2>
            <p className="text-muted-foreground mb-8">
              You've completed all available practice questions for {topic}. Great job!
            </p>
            <Button onClick={() => navigate('/placement/aptitude')}>
              Explore Other Topics
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16 max-w-3xl">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate('/placement/aptitude')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{topic}</h1>
            <p className="text-muted-foreground">{category} Practice</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Question {currentIndex + 1} / {questions.length}
          </Badge>
        </div>

        <Card className="mb-6 shadow-md border-primary/10">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <div className="flex justify-between items-start mb-2">
              <Badge>{currentQuestion.difficulty}</Badge>
            </div>
            <CardTitle className="text-xl leading-relaxed font-medium">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, idx: number) => {
                let btnVariant = "outline" as const;
                let btnClass = "w-full justify-start text-left h-auto py-4 px-6 text-base font-normal whitespace-normal";
                let Icon = null;

                if (feedback) {
                  if (idx === feedback.correctAnswer) {
                    btnVariant = "default";
                    btnClass += " bg-green-500 hover:bg-green-600 border-green-500 text-white";
                    Icon = <CheckCircle2 className="w-5 h-5 ml-auto shrink-0" />;
                  } else if (idx === selectedOption) {
                    btnVariant = "destructive";
                    btnClass += " border-red-500";
                    Icon = <XCircle className="w-5 h-5 ml-auto shrink-0" />;
                  }
                } else if (idx === selectedOption) {
                  btnClass += " ring-2 ring-primary bg-primary/5";
                }

                return (
                  <Button 
                    key={idx} 
                    variant={btnVariant}
                    className={btnClass}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={feedback !== null || submitMutation.isPending}
                  >
                    <span className="mr-4 font-semibold text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                    <span className="flex-1">{option}</span>
                    {Icon}
                  </Button>
                );
              })}
            </div>
            
            {submitMutation.isPending && (
              <div className="text-center mt-6 text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying answer...
              </div>
            )}
          </CardContent>
        </Card>

        {feedback && (
          <Card className={`border-l-4 animate-in slide-in-from-bottom-4 ${feedback.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg flex items-center gap-2 ${feedback.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {feedback.isCorrect ? (
                  <><CheckCircle2 className="w-5 h-5" /> Correct Answer!</>
                ) : (
                  <><XCircle className="w-5 h-5" /> Incorrect</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-semibold mb-2">Explanation:</h4>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{feedback.explanation}</p>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleNext} className="gap-2">
                Next Question <ChevronRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  );
}
