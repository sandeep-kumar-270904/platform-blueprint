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
import { useAuth } from "@/hooks/useAuth";

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
    authorDifficulty?: string;
    calibratedDifficulty?: string;
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
            <h4 className="font-semibold text-sm text-muted-foreground">Difficulty Discrepancies & Low Scores:</h4>
            <ul className="text-sm space-y-2">
              {data.questionDifficulty.map(q => {
                const isLowScore = q.correctRate < 30;
                
                const diffMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
                const aDiff = diffMap[q.authorDifficulty || 'medium'] || 2;
                const cDiff = diffMap[q.calibratedDifficulty || q.authorDifficulty || 'medium'] || 2;
                const hasDiscrepancy = Math.abs(aDiff - cDiff) >= 1 && q.calibratedDifficulty;

                if (!isLowScore && !hasDiscrepancy) return null;

                return (
                  <li key={q.questionIndex} className="p-3 border rounded bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold w-8">Q{q.questionIndex + 1}:</span>
                      <span className="truncate flex-1 font-medium">{q.questionText}</span>
                      <span className="font-mono text-xs">{q.correctRate.toFixed(1)}% Correct</span>
                    </div>
                    <div className="pl-10 text-xs flex gap-4">
                      {isLowScore && <span className="text-red-500 font-semibold">Critical Low Score</span>}
                      {hasDiscrepancy && (
                        <span className="text-orange-500 font-semibold flex items-center gap-1">
                          Author: <span className="capitalize">{q.authorDifficulty}</span> →
                          System: <span className="capitalize">{q.calibratedDifficulty}</span>
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
              {data.questionDifficulty.filter(q => {
                const diffMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
                const aDiff = diffMap[q.authorDifficulty || 'medium'] || 2;
                const cDiff = diffMap[q.calibratedDifficulty || q.authorDifficulty || 'medium'] || 2;
                return q.correctRate < 30 || (Math.abs(aDiff - cDiff) >= 1 && q.calibratedDifficulty);
              }).length === 0 && (
                <li className="text-muted-foreground">No critical issues or discrepancies found.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
