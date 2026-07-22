import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import axios from "axios";

export const OAResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/oa/results/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResult(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  if (!result) return <div className="p-8">Result not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Simulation Complete</h1>
            <p className="text-muted-foreground mb-6">{result.oaDefinition?.name}</p>
            
            <div className="flex justify-center gap-12">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Score</p>
                <p className="text-4xl font-black text-primary">{result.overallScore} / {result.maxScore}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Time Taken</p>
                <p className="text-4xl font-black">{Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s</p>
              </div>
            </div>

            {result.tabSwitches > 0 && (
              <div className="mt-6 p-3 bg-red-500/10 text-red-500 rounded text-sm max-w-md mx-auto">
                <strong>Warning:</strong> You switched tabs {result.tabSwitches} times. In a real OA, this could lead to disqualification.
              </div>
            )}
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6">Section Breakdown & Review</h2>
        <div className="space-y-6">
          {result.sections.map((sec: any, sIdx: number) => (
            <Card key={sIdx}>
              <CardHeader className="bg-muted/30 border-b">
                <h3 className="font-bold text-lg">{sec.title} ({sec.type})</h3>
              </CardHeader>
              <CardContent className="p-0">
                {sec.type === 'Aptitude' ? (
                  <div className="divide-y">
                    {sec.aptitudeResponses.map((r: any, qIdx: number) => (
                      <div key={qIdx} className="p-4 flex gap-4">
                        <div className="mt-1 shrink-0">
                          {r.isCorrect ? <CheckCircle className="w-5 h-5 text-green-500"/> : <XCircle className="w-5 h-5 text-red-500"/>}
                        </div>
                        <div>
                          <p className="font-medium mb-2">{r.question.questionText}</p>
                          <p className="text-sm text-muted-foreground mb-1">Your Answer: {r.selectedAnswer !== null ? r.question.options[r.selectedAnswer] : 'Skipped'}</p>
                          <p className="text-sm text-green-600">Correct Answer: {r.question.options[r.question.correctAnswer]}</p>
                          {!r.isCorrect && r.question.explanation && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">{r.question.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {sec.codingResponses.map((r: any, qIdx: number) => (
                      <div key={qIdx} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold">{r.question?.title || "Coding Question"}</h4>
                          <div className="text-right">
                            <span className="text-sm font-medium border rounded px-2 py-1 bg-muted">{r.score} / 10 pts</span>
                            <p className="text-xs text-muted-foreground mt-1">{r.testCasesPassed} / {r.totalTestCases} Test Cases</p>
                          </div>
                        </div>
                        <div className="bg-[#1e1e1e] p-4 rounded text-green-400 font-mono text-xs overflow-x-auto">
                          {r.code || "// No code submitted"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};
