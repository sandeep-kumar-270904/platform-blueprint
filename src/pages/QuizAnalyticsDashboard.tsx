import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function QuizAnalyticsDashboard() {
  const [topics, setTopics] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attempts/analytics/topics'),
      api.get('/quizzes/recommendations')
    ]).then(([tRes, rRes]) => {
      setTopics(tRes.data);
      setRecommendations(rRes.data);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Cross-Quiz Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500"/> Topic Mastery</CardTitle>
              <CardDescription>Your performance across different categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {topics.length === 0 ? (
                <p className="text-muted-foreground text-sm">Not enough data to analyze yet.</p>
              ) : (
                topics.map(t => (
                  <div key={t.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{t.category}</span>
                      <span>{t.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500"/> Recommended Practice</CardTitle>
              <CardDescription>Quizzes to help improve your weak spots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No specific recommendations at this time.</p>
              ) : (
                recommendations.map(r => (
                  <div key={r._id} className="p-3 border rounded-lg hover:bg-muted/50 transition flex justify-between items-center cursor-pointer" onClick={() => window.location.href=`/quizzes/${r._id}`}>
                    <div>
                      <h4 className="font-semibold text-sm">{r.title}</h4>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full dark:bg-violet-900 dark:text-violet-100">Practice</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
