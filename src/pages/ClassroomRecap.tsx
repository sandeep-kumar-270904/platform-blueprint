import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, BarChart2, Star, Sparkles, Brain, Clock, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const ClassroomRecap = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    const fetchRecap = async () => {
      if (!id || !user) return;
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/classrooms/${id}/recap`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setClassroom(data.classroom);
          setFeedbackSubmitted(data.feedbackSubmitted);
          if (data.analytics) {
            setAnalytics(data.analytics);
          }
        }
      } catch {}
      setLoading(false);
    };

    fetchRecap();
  }, [id, user]);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a rating.");
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/classrooms/${id}/feedback`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      setFeedbackSubmitted(true);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  const generateAI = async () => {
    setAiGenerating(true);
    
    // Simulate AI generation process
    setTimeout(async () => {
      const summary = `During this session, we discussed the core concepts outlined in the curriculum. Key takeaways include mastering the foundations of the topic, understanding best practices for implementation, and avoiding common pitfalls. The Q&A portion clarified several ambiguities regarding deployment strategies.`;
      
      const actionItems = [];
      
      const flashcards = [];

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/classrooms/${id}/ai-summary`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai_summary: summary, ai_action_items: actionItems, ai_flashcards: flashcards })
        });
        
        setClassroom({
          ...classroom,
          ai_summary: summary,
          ai_action_items: actionItems,
          ai_flashcards: flashcards
        });
        
        toast.success("AI Summary Generated!");
      } catch {} finally {
        setAiGenerating(false);
      }
    }, 2500);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isHost = classroom?.host_id === user?.id;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-5xl">
        <div className="mb-8">
          <Link to="/virtual-classroom" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Classrooms
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Session Recap: {classroom.title}</h1>
              <p className="text-muted-foreground">Ended on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* AI Summary Section */}
            <Card className="border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> AI Session Summary
                  <Badge variant="outline" className="ml-2 border-primary/30 text-primary bg-primary/10">AI-Generated</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classroom.ai_summary ? (
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed">{classroom.ai_summary}</p>
                    
                    {classroom.ai_action_items && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Action Items</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                          {classroom.ai_action_items.map((item: string, i: number) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">No summary generated yet.</p>
                    {isHost && (
                      <Button onClick={generateAI} disabled={aiGenerating}>
                        {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        {aiGenerating ? "Analyzing Session..." : "Generate AI Summary"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flashcards */}
            {classroom.ai_flashcards && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5" /> Smart Study Cards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {classroom.ai_flashcards.map((card: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg bg-card hover:bg-accent/10 transition-colors">
                        <p className="font-medium text-sm mb-2">Q: {card.q}</p>
                        <p className="text-xs text-muted-foreground">A: {card.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Host Analytics */}
            {isHost && analytics && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart2 className="h-5 w-5" /> Host Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Show-up Rate</span>
                      <span className="font-medium">{analytics.totalRSVP > 0 ? Math.round((analytics.actualAttendance / analytics.totalRSVP) * 100) : 0}%</span>
                    </div>
                    <Progress value={analytics.totalRSVP > 0 ? (analytics.actualAttendance / analytics.totalRSVP) * 100 : 0} className="h-2" />
                    <p className="text-[10px] text-muted-foreground mt-1">{analytics.actualAttendance} attended / {analytics.totalRSVP} RSVP'd</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Avg Watch Time</p>
                      <p className="text-xl font-bold flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {analytics.avgDuration}m</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Peak Attendees</p>
                      <p className="text-xl font-bold flex items-center gap-1"><Users className="h-4 w-4 text-primary" /> {analytics.actualAttendance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {!isHost && !feedbackSubmitted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rate this session</CardTitle>
                  <CardDescription>Help the host improve future sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitFeedback} className="space-y-4">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                          <Star className={`h-8 w-8 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Optional feedback..." 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="resize-none"
                    />
                    <Button type="submit" className="w-full">Submit Feedback</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {!isHost && feedbackSubmitted && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-6 text-center">
                  <Star className="h-12 w-12 text-yellow-400 fill-yellow-400 mx-auto mb-3" />
                  <h3 className="font-semibold">Feedback Received</h3>
                  <p className="text-sm text-muted-foreground">Thank you for rating this session!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomRecap;
