import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Video, ThumbsUp, Send, Loader2, Users, StopCircle, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { io } from "socket.io-client";

export default function AMADetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSessionData();
    fetchQuestions();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.on(`ama-q-${id}`, (data) => {
      if (data.action === 'new_question') {
        fetchQuestions(); // Refresh to get populated data
      } else if (data.action === 'vote_update') {
        setQuestions(prev => prev.map(q => q._id === data.question_id ? { ...q, upvotes: data.upvotes } : q).sort((a,b) => b.upvotes - a.upvotes));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const fetchSessionData = async () => {
    // We fetch all sessions and find ours since there's no single session endpoint in our Phase 3 yet.
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions`);
      if (res.ok) {
        const data = await res.json();
        const found = data.find((s: any) => s._id === id);
        if (found) setSession(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions/${id}/questions`, { headers });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) return;
    setBusy(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions/${id}/questions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion })
      });
      if (res.ok) {
        setNewQuestion("");
        fetchQuestions();
        toast({ title: "Question posted!" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user) {
      toast({ title: "Sign in to vote", variant: "destructive" });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuestions(); // Opting for full refresh to sync has_voted state
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAMA = async () => {
    if (!confirm("Are you sure you want to cancel this AMA?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "AMA Cancelled" });
        navigate('/mentors/amas');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRecording = async () => {
    const url = prompt("Enter YouTube / Video URL for the recording:");
    if (!url) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions/${id}/recording`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_url: url })
      });
      if (res.ok) {
        toast({ title: "Recording added" });
        fetchSessionData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!session) {
    return <div className="flex h-screen items-center justify-center">AMA not found.</div>;
  }

  const isHost = user && session.mentor_id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          <div className="w-full md:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">{session.status.toUpperCase()}</Badge>
                <CardTitle>{session.title}</CardTitle>
                <p className="text-sm text-muted-foreground">Hosted by {session.mentor_profile?.full_name}</p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>{session.description}</p>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {session.participant_count} / {session.max_participants} joined</div>
                
                {isHost && (
                  <div className="pt-4 border-t space-y-2 mt-4">
                    <p className="font-semibold mb-2">Host Controls</p>
                    <Button variant="outline" className="w-full justify-start" onClick={handleAddRecording}>
                      <Video className="mr-2 h-4 w-4" /> Add Recording URL
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={handleCancelAMA} disabled={session.status === 'completed' || session.status === 'cancelled'}>
                      <StopCircle className="mr-2 h-4 w-4" /> Cancel Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Q&A Board</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <form onSubmit={handleAsk} className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      placeholder="Ask a question..." 
                      className="flex-1 border rounded-md px-3 py-2"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      required
                      disabled={busy || session.status === 'completed' || session.status === 'cancelled'}
                    />
                    <Button type="submit" disabled={busy || session.status === 'completed' || session.status === 'cancelled'}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                ) : (
                  <p className="mb-6 text-sm text-muted-foreground border-b pb-4">Sign in to ask a question.</p>
                )}

                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No questions asked yet. Be the first!</p>
                  ) : (
                    questions.map((q) => (
                      <div key={q._id} className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                        <div className="flex flex-col items-center gap-1 min-w-[40px]">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 rounded-full ${q.has_voted ? 'text-primary bg-primary/10' : ''}`}
                            onClick={() => handleVote(q._id)}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-semibold">{q.upvotes}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">{q.question}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={q.user_profile?.avatar_url} />
                              <AvatarFallback>{q.user_profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{q.user_profile?.full_name || 'Anonymous User'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
