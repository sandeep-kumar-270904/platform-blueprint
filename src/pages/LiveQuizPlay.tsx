import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { io, Socket } from "socket.io-client";
import { Loader2, Trophy, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveQuizPlay = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [sessionState, setSessionState] = useState<'waiting_room' | 'in_progress' | 'completed' | null>(null);
  const [pacingMode, setPacingMode] = useState<'host'|'self'>('host');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; awardedPoints: number } | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId || !user) return;

    // To reconnect properly we need a joinCode. The API actually doesn't give us joinCode if we navigate directly to sessionId unless we fetch it.
    // However, the socket `joinSession` expects `joinCode`. We should fetch the session first or change `joinSession` to accept `sessionId`.
    // Let's assume we can fetch the session via GET /api/live-sessions/:id to get the joinCode.
    const connectToSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/live-sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error("Could not find session");
        const sessionData = await res.json();

        const newSocket = io(API_URL);
        
        newSocket.on('connect', () => {
          newSocket.emit('joinSession', { joinCode: sessionData.joinCode, userId: user._id });
        });

        newSocket.on('sessionState', (data) => {
          if (data.status) setSessionState(data.status);
          if (data.pacingMode) setPacingMode(data.pacingMode);
          if (data.currentQuestionIndex !== undefined) setQuestionIndex(data.currentQuestionIndex);
        });

        newSocket.on('participantUpdate', (data) => {
          setParticipants(data.participants);
        });

        newSocket.on('questionBroadcast', (data) => {
          setCurrentQuestion(data.question);
          setQuestionIndex(data.questionIndex);
          setSelectedOption(null);
          setAnswerResult(null);
          
          // Setup local timer based on server questionStartedAt
          const timeLimit = data.timeLimit;
          const startedAt = new Date(data.questionStartedAt).getTime();
          
          const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - startedAt) / 1000;
            const remaining = Math.max(0, timeLimit - elapsed);
            setTimeLeft(Math.ceil(remaining));
            
            if (remaining <= 0) {
              clearInterval(interval);
            }
          }, 500);
          
          // Store interval to clear it when question changes
          (window as any).questionTimerInterval = interval;
        });

        newSocket.on('answerResult', (data) => {
          setAnswerResult(data);
        });

        newSocket.on('leaderboardUpdate', (data) => {
          setLeaderboard(data.leaderboard);
        });

        newSocket.on('sessionEnded', (data) => {
          setSessionState('completed');
          setLeaderboard(data.leaderboard);
          clearInterval((window as any).questionTimerInterval);
        });

        setSocket(newSocket);
      } catch (err: any) {
        toast.error(err.message);
        navigate('/live/join');
      }
    };
    
    connectToSession();

    return () => {
      if (socket) socket.disconnect();
      clearInterval((window as any).questionTimerInterval);
    };
  }, [sessionId, user]);

  const handleSubmitAnswer = (optIdx: number) => {
    if (selectedOption !== null || !socket || timeLeft === 0 || timeLeft === null) return;
    
    setSelectedOption(optIdx);
    socket.emit('submitAnswer', {
      sessionId,
      userId: user?._id,
      questionIndex,
      selectedOptionIndex: optIdx
    });
  };

  if (!sessionState) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Header />
      
      <div className="container max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col">
        {sessionState === 'waiting_room' && pacingMode === 'host' && (
          <Card className="flex-1 border-0 shadow-md text-center py-12 flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
            <h2 className="text-3xl font-bold mb-4">Waiting for Host to Start...</h2>
            <p className="text-lg text-muted-foreground mb-8">You're in! Get ready, the quiz will begin shortly.</p>
            <div className="px-6 py-3 bg-muted rounded-full">
              <span className="font-semibold text-lg">{participants.length} Participants Joined</span>
            </div>
          </Card>
        )}
        
        {sessionState === 'waiting_room' && pacingMode === 'self' && !currentQuestion && (
          <Card className="flex-1 border-0 shadow-md text-center py-12 flex flex-col items-center justify-center bg-background">
            <h2 className="text-3xl font-bold mb-4">Homework Mode</h2>
            <p className="text-lg text-muted-foreground mb-8">You can start this quiz at your own pace.</p>
            <Button size="lg" onClick={() => socket?.emit('advanceSelfPaced', { sessionId, userId: user?._id })}>Start Quiz</Button>
          </Card>
        )}

        {((sessionState === 'in_progress') || (pacingMode === 'self' && currentQuestion)) && sessionState !== 'completed' && (
          <div className="grid md:grid-cols-3 gap-6 flex-1">
            <Card className="md:col-span-2 border-0 shadow-sm flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 h-1 bg-primary transition-all ease-linear duration-500`} style={{ width: `${(timeLeft! / (currentQuestion.timeLimit || 20)) * 100}%` }} />
              
              <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between pb-4">
                <CardTitle>Question {questionIndex + 1}</CardTitle>
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft! <= 5 ? 'text-destructive animate-pulse' : ''}`}>
                  <Clock className="h-5 w-5" />
                  {timeLeft}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-8 flex flex-col">
                <h3 className="text-2xl font-semibold mb-8">
                  {currentQuestion.questionText}
                </h3>
                
                <div className="space-y-4">
                  {currentQuestion.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === idx;
                    const isDisabled = selectedOption !== null || timeLeft === 0;
                    
                    let bgClass = "bg-background";
                    if (isSelected) {
                      bgClass = "bg-primary text-primary-foreground border-primary";
                    } else if (isDisabled) {
                      bgClass = "bg-muted/50 text-muted-foreground";
                    }

                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        className={`w-full justify-start text-left h-auto py-4 px-6 text-lg whitespace-normal ${bgClass}`}
                        onClick={() => handleSubmitAnswer(idx)}
                        disabled={isDisabled}
                      >
                        <span className="font-bold mr-4">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </Button>
                    );
                  })}
                </div>

                {answerResult && (
                  <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                    <div className={`p-4 w-full rounded-lg flex items-center justify-center gap-3 text-lg font-bold ${answerResult.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {answerResult.isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                      {answerResult.isCorrect ? `Correct! +${answerResult.awardedPoints} points` : 'Incorrect'}
                    </div>
                    {pacingMode === 'self' && (
                      <Button className="mt-4 w-full max-w-xs" onClick={() => socket?.emit('advanceSelfPaced', { sessionId, userId: user?._id })}>
                        Next Question
                      </Button>
                    )}
                  </div>
                )}
                {timeLeft === 0 && selectedOption === null && (
                  <div className="mt-8 flex flex-col items-center animate-in fade-in">
                    <div className="p-4 w-full rounded-lg flex items-center justify-center gap-3 text-lg font-bold bg-muted text-muted-foreground">
                      <Clock className="h-6 w-6" /> Time's up!
                    </div>
                    {pacingMode === 'self' && (
                      <Button className="mt-4 w-full max-w-xs" onClick={() => socket?.emit('advanceSelfPaced', { sessionId, userId: user?._id })}>
                        Next Question
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm flex flex-col h-full max-h-[600px]">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto">
                <div className="divide-y">
                  {leaderboard.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">No scores yet</p>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-4 transition-all ${entry._id === user?._id ? 'bg-primary/5 font-semibold' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold w-4 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[120px]">{entry.name} {entry._id === user?._id && "(You)"}</span>
                        </div>
                        <span className="font-bold text-primary shrink-0">{entry.score} pts</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {sessionState === 'completed' && (
          <Card className="border-0 shadow-sm text-center py-12 animate-in fade-in zoom-in">
            <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Quiz Finished!</h2>
            <p className="text-xl text-muted-foreground mb-8">Check out the final results.</p>
            
            <div className="max-w-md mx-auto border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/50 p-4 border-b font-bold text-lg">Final Leaderboard</div>
              <div className="divide-y">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-4 ${entry._id === user?._id ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold w-4 ${idx === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>{idx + 1}</span>
                      <span className="font-medium">{entry.name} {entry._id === user?._id && "(You)"}</span>
                    </div>
                    <span className="font-bold">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="mt-8" onClick={() => navigate('/my-quizzes')}>View Detailed Results</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveQuizPlay;
