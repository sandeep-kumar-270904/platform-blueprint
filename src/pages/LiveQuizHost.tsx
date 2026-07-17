import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getQuiz, createLiveSession, inviteToLiveSession, type Quiz } from "@/hooks/useQuizHub";
import { io, Socket } from "socket.io-client";
import { Loader2, Users, Play, SkipForward, CheckCircle2, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveQuizHost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [participants, setParticipants] = useState<any[]>([]);
  const [sessionState, setSessionState] = useState<'waiting_room' | 'in_progress' | 'completed'>('waiting_room');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [inviteEmails, setInviteEmails] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    
    const init = async () => {
      try {
        const q = await getQuiz(id);
        if (!q) {
          toast.error("Quiz not found");
          return navigate('/quizzes');
        }
        setQuiz(q);
      } catch (err: any) {
        toast.error(err.message);
        navigate(`/quizzes/${id}`);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, user]);

  const handleCreateSession = async (mode: 'host' | 'self') => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const newSession = await createLiveSession(id, { pacingMode: mode });
      setSessionInfo(newSession);

      const newSocket = io(API_URL);
        
        newSocket.on('connect', () => {
          newSocket.emit('joinSession', { joinCode: newSession.joinCode, userId: user._id });
        });

        newSocket.on('participantUpdate', (data) => {
          setParticipants(data.participants);
        });

        newSocket.on('sessionState', (data) => {
          if (data.status) setSessionState(data.status);
          if (data.currentQuestionIndex !== undefined) setCurrentQuestionIndex(data.currentQuestionIndex);
        });

        newSocket.on('leaderboardUpdate', (data) => {
          setLeaderboard(data.leaderboard);
        });

        newSocket.on('sessionEnded', (data) => {
          setSessionState('completed');
          setLeaderboard(data.leaderboard);
        });

        setSocket(newSocket);

      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id, user]);

  const handleStartSession = () => {
    if (!socket || !sessionInfo) return;
    socket.emit('startSession', { sessionId: sessionInfo._id, hostId: user?._id });
  };

  const handleNextQuestion = () => {
    if (!socket || !sessionInfo) return;
    socket.emit('advanceQuestion', { sessionId: sessionInfo._id, hostId: user?._id });
  };
  
  const copyJoinCode = () => {
    if (sessionInfo) {
      navigator.clipboard.writeText(sessionInfo.joinCode);
      toast.success("Join code copied!");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmails.trim() || !sessionInfo) return;
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e);
    if (emails.length === 0) return;
    
    setInviting(true);
    try {
      await inviteToLiveSession(sessionInfo._id, emails);
      toast.success(`Sent ${emails.length} invite(s)`);
      setInviteEmails("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading || !quiz) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Header />
      
      <div className="container max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hosting: {quiz.title}</h1>
          {sessionInfo && (
            <Badge variant={sessionState === 'in_progress' ? 'destructive' : 'secondary'} className="text-sm px-3 py-1">
              {sessionState.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        {!sessionInfo && (
          <Card className="flex-1 border-0 shadow-md flex flex-col items-center justify-center p-8 bg-background">
            <h2 className="text-3xl font-bold mb-8">Choose Session Mode</h2>
            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
              <Card className="border-2 hover:border-primary transition-all cursor-pointer overflow-hidden flex flex-col group" onClick={() => handleCreateSession('host')}>
                <div className="h-32 bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <Users className="h-16 w-16 text-indigo-500" />
                </div>
                <CardHeader>
                  <CardTitle>Live Host Mode</CardTitle>
                  <CardDescription>You control the pace. Everyone plays together in real-time.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-all cursor-pointer overflow-hidden flex flex-col group" onClick={() => handleCreateSession('self')}>
                <div className="h-32 bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                  <Play className="h-16 w-16 text-pink-500" />
                </div>
                <CardHeader>
                  <CardTitle>Homework Mode</CardTitle>
                  <CardDescription>Participants play at their own pace. Great for assignments.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </Card>
        )}

        {sessionInfo && sessionState === 'waiting_room' && (
          <Card className="flex-1 border-0 shadow-md text-center py-12 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
            <h2 className="text-3xl font-bold mb-4">Join at <span className="text-primary font-mono bg-background px-4 py-2 rounded-lg border">{API_URL}/live</span></h2>
            <div className="mb-8">
              <p className="text-lg text-muted-foreground mb-2">Or enter this Join Code:</p>
              <div 
                className="text-6xl font-black tracking-widest font-mono cursor-pointer hover:opacity-80 transition-opacity bg-background border px-8 py-4 rounded-xl shadow-inner inline-block"
                onClick={copyJoinCode}
              >
                {sessionInfo?.joinCode}
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1 cursor-pointer" onClick={copyJoinCode}>
                <Copy className="h-4 w-4" /> Click to copy
              </p>
            </div>

            <div className="w-full max-w-md mx-auto mb-8 bg-background p-4 rounded-xl border shadow-sm flex flex-col gap-3">
              <p className="text-sm font-medium text-left">Invite specific people</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter emails (comma separated)" 
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleInvite} disabled={inviting || !inviteEmails.trim()}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Invite
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8 bg-background px-6 py-3 rounded-full border shadow-sm">
              <Users className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold text-lg">{participants.length} Participants Waiting/Active</span>
            </div>

            {sessionInfo.pacingMode === 'host' ? (
              <Button size="lg" className="h-16 px-12 text-xl" onClick={handleStartSession} disabled={participants.length === 0}>
                <Play className="mr-2 h-6 w-6" /> Start Quiz Session
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="h-16 px-12 text-xl" onClick={() => navigate('/quizzes')}>
                Return to Quizzes
              </Button>
            )}
          </Card>
        )}

        {sessionInfo && sessionState === 'in_progress' && sessionInfo.pacingMode === 'host' && (
          <div className="grid md:grid-cols-3 gap-6 flex-1">
            <Card className="md:col-span-2 border-0 shadow-sm flex flex-col">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle>Question {currentQuestionIndex + 1} of {quiz.question_count}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-8 flex flex-col justify-center items-center text-center">
                <h3 className="text-2xl font-semibold mb-8">
                  {/* We don't have the question text easily here unless we fetched it or socket sent it. For the host, we just see progress */}
                  Question is active for participants.
                </h3>
                <Button size="lg" variant="default" className="h-14 px-8 text-lg w-full max-w-sm" onClick={handleNextQuestion}>
                  Next Question <SkipForward className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Live Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {leaderboard.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">Waiting for answers...</p>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground w-4">{idx + 1}</span>
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <span className="font-bold text-primary">{entry.score} pts</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {sessionInfo && sessionState === 'completed' && (
          <Card className="border-0 shadow-sm text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-8">Session Completed!</h2>
            
            <div className="max-w-md mx-auto border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/50 p-4 border-b font-bold text-lg">Final Leaderboard</div>
              <div className="divide-y">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-4 ${idx === 0 ? 'bg-yellow-500/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold w-4 ${idx === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>{idx + 1}</span>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <Button className="mt-8" onClick={() => navigate('/quizzes')}>Return to Hub</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveQuizHost;
