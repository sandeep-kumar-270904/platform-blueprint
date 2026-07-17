import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, PlusCircle, TrendingUp, Users } from 'lucide-react';
import api from '@/lib/api';

interface QuizOverview {
  _id: string;
  title: string;
  attemptCount: number;
  averageScore: number;
  completionRate: number;
}

interface OverviewData {
  totalQuizzes: number;
  totalAttempts: number;
  overallAverageScore: number;
  bestPerformingQuiz: { _id: string; title: string; completionRate: number } | null;
  quizzes: QuizOverview[];
}

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/creators/quiz-analytics-overview');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching creator overview', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load overview data</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your quizzes and track their performance.</p>
        </div>
        <Button onClick={() => navigate('/create-quiz')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
        </Button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalQuizzes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalAttempts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Score Across All</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overallAverageScore.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bestPerformingQuiz ? (
              <div>
                <div className="text-lg font-bold truncate" title={data.bestPerformingQuiz.title}>
                  {data.bestPerformingQuiz.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.bestPerformingQuiz.completionRate.toFixed(1)}% Completion Rate
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Quizzes List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.quizzes.map(quiz => (
            <Card key={quiz._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate" title={quiz.title}>{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Users className="w-4 h-4 mr-1"/> Attempts
                  </span>
                  <span className="font-semibold">{quiz.attemptCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1"/> Avg Score
                  </span>
                  <span className="font-semibold">{quiz.averageScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1"/> Completion
                  </span>
                  <span className="font-semibold">{quiz.completionRate.toFixed(1)}%</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/analytics/${quiz._id}`)}>
                  View Detailed Analytics
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {data.quizzes.length === 0 && (
            <div className="col-span-full text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">You haven't created any quizzes yet.</p>
              <Button onClick={() => navigate('/create-quiz')}>Create your first quiz</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
