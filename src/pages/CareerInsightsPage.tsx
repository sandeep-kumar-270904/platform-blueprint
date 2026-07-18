import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Target, TrendingUp, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';

export const CareerInsightsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  const token = localStorage.getItem('token');
  const [benchmark, setBenchmark] = useState<any>(null);
  const [rejectionInsights, setRejectionInsights] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      // Mocking target role for demo
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/insights/benchmark?role=developer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setBenchmark(data))
      .catch(console.error);

      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications/insights/rejections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setRejectionInsights(data))
      .catch(console.error);
    }
  }, [token]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/resumes/insights');
        setInsights(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Career Insights</h1>
            <p className="text-muted-foreground">Data-driven analysis of your resume performance</p>
          </div>
        </div>

        {!insights ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Not enough data to generate insights yet. Create a resume and apply to some jobs!
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* ATS Trend Chart Placeholder */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  ATS Score Trend
                </CardTitle>
                <CardDescription>How your resume scores have improved over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-4 px-4 pb-4 border-b border-l">
                  {insights.atsTrend?.map((pt: any, i: number) => (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div 
                        className="w-full bg-blue-500/80 hover:bg-blue-600 transition-all rounded-t relative"
                        style={{ height: `${pt.score}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                          {pt.score}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground mt-2 truncate w-full text-center" title={pt.title}>
                        {pt.title.substring(0, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Skill Gaps
                </CardTitle>
                <CardDescription>Missing skills highly requested in jobs you applied to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.skillGaps?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No significant skill gaps found!</p>
                  ) : (
                    insights.skillGaps?.map((gap: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-medium capitalize">{gap.skill}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          Required by {gap.demand} jobs
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Next Steps */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Gemini Action Plan
                </CardTitle>
                <CardDescription>AI-generated next steps based on your profile and market demand</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {insights.nextSteps?.map((step: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                        {i + 1}
                      </span>
                      <p className="text-slate-700 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

          </div>
        )}
      
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tailoring Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.tailoringEffectiveness ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-md bg-muted/20">
                  <h4 className="font-semibold mb-2">Tailored Applications</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Total sent:</span>
                    <span className="font-medium">{insights.tailoringEffectiveness.tailored.total}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Interviews/Offers:</span>
                    <span className="font-medium text-green-600">{insights.tailoringEffectiveness.tailored.interviewed}</span>
                  </div>
                  <div className="mt-4 text-2xl font-bold text-primary">
                    {insights.tailoringEffectiveness.tailored.rate.toFixed(1)}% <span className="text-sm font-normal text-muted-foreground">Success Rate</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/20">
                  <h4 className="font-semibold mb-2">Untailored Applications</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Total sent:</span>
                    <span className="font-medium">{insights.tailoringEffectiveness.untailored.total}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Interviews/Offers:</span>
                    <span className="font-medium text-green-600">{insights.tailoringEffectiveness.untailored.interviewed}</span>
                  </div>
                  <div className="mt-4 text-2xl font-bold text-muted-foreground">
                    {insights.tailoringEffectiveness.untailored.rate.toFixed(1)}% <span className="text-sm font-normal">Success Rate</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Not enough data to calculate tailoring effectiveness yet.</p>
            )}
          </CardContent>
        </Card>

      </div>
      <CareerSimulator resumeId={resumeId as string} />

      {rejectionInsights.length > 0 && (
        <Card className="mt-6 border-red-200 dark:border-red-900/50">
          <CardHeader className="bg-red-50/50 dark:bg-red-900/10">
            <CardTitle>Application Insights: Rejection Feedback</CardTitle>
            <CardDescription>Aggregate themes from your past applications to help you improve.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {rejectionInsights.map((insight: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <span className="capitalize font-medium">{insight.feedback.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">{insight.count} rejections cited this</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {benchmark?.available && (
        <Card className="mt-6 border-blue-200 dark:border-blue-900/50">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10">
            <CardTitle>Industry Benchmark</CardTitle>
            <CardDescription>How your resume compares to others in your target role</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-2xl font-bold">{data.currentScore || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Industry Average</p>
                <p className="text-2xl font-bold text-blue-600">{benchmark.averageScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default CareerInsightsPage;
