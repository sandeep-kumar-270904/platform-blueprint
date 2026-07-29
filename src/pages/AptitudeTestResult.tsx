import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Target, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export default function AptitudeTestResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const { data: result, isLoading } = useQuery({
    queryKey: ['aptitudeTestResult', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/aptitude/test/results/${id}`, { headers: getAuthHeaders() });
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[70vh]">Loading results...</div>
      </div>
    );
  }

  if (!result) return null;

  const percentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const chartData = [
    { name: 'Correct', value: result.totalScore, color: '#22c55e' },
    { name: 'Incorrect/Skipped', value: result.maxScore - result.totalScore, color: '#ef4444' }
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (reviewMode) {
    const r = result.responses[reviewIndex];
    const q = r.question;
    
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16 max-w-3xl">
          <Button variant="ghost" className="mb-6 -ml-4" onClick={() => setReviewMode(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Summary
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Review Mode</h1>
              <p className="text-muted-foreground">{q.category} • {q.topic}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              Question {reviewIndex + 1} / {result.responses.length}
            </Badge>
          </div>

          <Card className="mb-6 shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={r.isCorrect ? "default" : "destructive"}>
                  {r.isCorrect ? 'Correct' : r.selectedAnswer === null ? 'Skipped' : 'Incorrect'}
                </Badge>
              </div>
              <CardTitle className="text-xl leading-relaxed font-medium">
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 mb-8">
                {q.options.map((option: string, idx: number) => {
                  let borderClass = "border-border";
                  let bgClass = "bg-background";
                  let textClass = "text-foreground";
                  let Icon = null;
                  
                  if (idx === q.correctAnswer) {
                    borderClass = "border-green-500 ring-1 ring-green-500";
                    bgClass = "bg-green-50 dark:bg-green-950/20";
                    textClass = "text-green-700 dark:text-green-400 font-medium";
                    Icon = <CheckCircle2 className="w-5 h-5 ml-auto text-green-500 shrink-0" />;
                  } else if (idx === r.selectedAnswer && !r.isCorrect) {
                    borderClass = "border-red-500";
                    bgClass = "bg-red-50 dark:bg-red-950/20";
                    textClass = "text-red-700 dark:text-red-400 font-medium line-through";
                    Icon = <XCircle className="w-5 h-5 ml-auto text-red-500 shrink-0" />;
                  }

                  return (
                    <div key={idx} className={`flex items-center py-4 px-6 rounded-md border ${borderClass} ${bgClass} ${textClass}`}>
                      <span className="mr-4 font-bold">{String.fromCharCode(65 + idx)}.</span>
                      <span className="flex-1">{option}</span>
                      {Icon}
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Explanation
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{q.explanation}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setReviewIndex(p => p - 1)} disabled={reviewIndex === 0}>
              Previous
            </Button>
            <Button onClick={() => setReviewIndex(p => p + 1)} disabled={reviewIndex === result.responses.length - 1}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16 max-w-5xl">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate('/placement/aptitude')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Test Results</h1>
          <p className="text-xl text-muted-foreground">Here's how you performed on your mock test.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Main Score Card */}
          <Card className="lg:col-span-1 shadow-md border-primary/20 bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center p-6 text-center">
            <Trophy className={`w-16 h-16 mb-4 ${percentage >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <h2 className="text-6xl font-extrabold text-primary mb-2">{percentage}%</h2>
            <p className="text-lg font-medium mb-1">{result.totalScore} / {result.maxScore} Correct</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4" /> Time Taken: {formatTime(result.timeTakenSeconds || (new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / 1000)}
            </div>

            {result.percentile !== undefined && (
              <div className="mt-4 bg-background border rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm">
                Top {100 - result.percentile}% of students
              </div>
            )}
            {result.percentile === undefined && (
              <div className="mt-4 text-xs text-muted-foreground italic px-4">
                Not enough data for percentile yet
              </div>
            )}
            
            <div className="w-full max-w-[200px] h-[200px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Section Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Section Analysis</CardTitle>
              <CardDescription>Breakdown of your performance across different sections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-lg">Quantitative Aptitude</span>
                  <span className="font-bold">{result.sectionScores.quantitative.score} / {result.sectionScores.quantitative.max}</span>
                </div>
                <Progress 
                  value={result.sectionScores.quantitative.max > 0 ? (result.sectionScores.quantitative.score / result.sectionScores.quantitative.max) * 100 : 0} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-lg">Logical Reasoning</span>
                  <span className="font-bold">{result.sectionScores.logical.score} / {result.sectionScores.logical.max}</span>
                </div>
                <Progress 
                  value={result.sectionScores.logical.max > 0 ? (result.sectionScores.logical.score / result.sectionScores.logical.max) * 100 : 0} 
                  className="h-3 [&>div]:bg-purple-500"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-lg">Verbal Ability</span>
                  <span className="font-bold">{result.sectionScores.verbal.score} / {result.sectionScores.verbal.max}</span>
                </div>
                <Progress 
                  value={result.sectionScores.verbal.max > 0 ? (result.sectionScores.verbal.score / result.sectionScores.verbal.max) * 100 : 0} 
                  className="h-3 [&>div]:bg-green-500"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="w-full max-w-sm" onClick={() => setReviewMode(true)}>
            Review Answers & Explanations
          </Button>
        </div>
      </main>
    </div>
  );
}
