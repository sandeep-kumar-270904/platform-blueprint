import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  attemptCount: number;
  averageScore: number;
  completionRate: number;
  breakdown: {
    liveCount: number;
    soloCount: number;
  };
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  questionDifficulty: {
    questionIndex: number;
    questionText: string;
    correctRate: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CreatorAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/analytics`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [id, user]);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const breakdownData = [
    { name: 'Live', value: data.breakdown.liveCount },
    { name: 'Solo', value: data.breakdown.soloCount },
  ].filter(d => d.value > 0);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/creator-dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Quiz Analytics</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attemptCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live vs Solo Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Session Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {breakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">No attempts recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Question Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle>Question Difficulty (Correct Rate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.questionDifficulty} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="questionIndex" type="category" tickFormatter={(val) => `Q${val + 1}`} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Correct Rate']} />
                <Bar dataKey="correctRate" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Questions needing review (Low correct rate &lt; 30%):</h4>
            <ul className="text-sm space-y-1">
              {data.questionDifficulty
                .filter(q => q.correctRate < 30)
                .map(q => (
                  <li key={q.questionIndex} className="flex items-center text-red-500">
                    <span className="font-bold w-8">Q{q.questionIndex + 1}:</span>
                    <span className="truncate flex-1">{q.questionText}</span>
                    <span className="font-mono ml-4">{q.correctRate.toFixed(1)}%</span>
                  </li>
                ))}
              {data.questionDifficulty.filter(q => q.correctRate < 30).length === 0 && (
                <li className="text-muted-foreground">None of your questions have a critical low score.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
