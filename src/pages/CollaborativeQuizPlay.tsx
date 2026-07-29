import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/api";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CollaborativeQuizPlay() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [session, setSession] = useState<any>(null);
  const [quizState, setQuizState] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, number>>({});
  
  const [chat, setChat] = useState<{user: string, text: string, time: Date}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch session
    api.get(`/gd-live/group/placeholder/sessions`).then(() => {
      // Actually we need an endpoint to fetch a single session, let's assume we have session data injected or we just rely on sockets
    }).catch(() => {});

    const newSocket = io(API_URL);
    
    newSocket.on("connect", () => {
      newSocket.emit("join_gd_session", { sessionId, userId: user?._id });
    });

    newSocket.on("gdError", (err) => {
      toast.error(err.message);
      navigate("/dashboard");
    });

    newSocket.on("gdQuizState", ({ quiz }) => {
      setQuizState(quiz);
    });

    newSocket.on("gd_user_voted", ({ userId, questionIndex, optionIndex }) => {
      if (questionIndex === currentQIndex) {
        setVotes(prev => ({ ...prev, [userId]: optionIndex }));
      }
    });

    newSocket.on("gd_question_advanced", ({ nextIndex }) => {
      setCurrentQIndex(nextIndex);
      setVotes({}); // Reset votes for next question
    });

    newSocket.on("gd_chat_received", ({ user: sender, text, timestamp }) => {
      setChat(prev => [...prev, { user: sender, text, time: new Date(timestamp) }]);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, user?._id]);

  const handleVote = (optionIndex: number) => {
    if (socket) {
      socket.emit("gd_vote_option", { sessionId, userId: user?._id, questionIndex: currentQIndex, optionIndex });
    }
  };

  const handleAdvance = () => {
    if (socket) {
      socket.emit("gd_host_advance", { sessionId, nextIndex: currentQIndex + 1 });
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit("gd_chat_message", { sessionId, user: user?.username || user?.full_name, text: chatInput });
    setChatInput("");
  };

  if (!quizState) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const currentQ = quizState.questions[currentQIndex];
  const isHost = true; // In real implementation, check if user is creator
  
  // Tally votes
  const voteCounts: Record<number, number> = {};
  Object.values(votes).forEach(opt => {
    voteCounts[opt] = (voteCounts[opt] || 0) + 1;
  });

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Main Quiz Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{quizState.title} - Group Study</h1>
          <Badge variant="outline" className="text-violet-600 border-violet-200">Collaborative Mode</Badge>
        </div>

        {currentQ ? (
          <Card className="max-w-3xl mx-auto w-full shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-xl font-medium mb-6">Q{currentQIndex + 1}. {currentQ.questionText}</h2>
              <div className="space-y-3">
                {currentQ.options.map((opt: string, i: number) => {
                  const pct = Object.keys(votes).length ? ((voteCounts[i] || 0) / Object.keys(votes).length) * 100 : 0;
                  const myVote = votes[user?._id || ''] === i;
                  return (
                    <div key={i} className="relative">
                      <Button
                        variant="outline"
                        className={`w-full justify-start h-auto min-h-12 py-3 px-4 z-10 relative bg-transparent text-left whitespace-normal ${myVote ? 'border-violet-600 ring-1 ring-violet-600' : ''}`}
                        onClick={() => handleVote(i)}
                      >
                        {opt}
                      </Button>
                      <div className="absolute top-0 left-0 h-full bg-violet-100 dark:bg-violet-900/30 rounded-md z-0 transition-all" style={{ width: `${pct}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10 text-sm font-medium text-violet-700 dark:text-violet-300">
                        {voteCounts[i] || 0} votes
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </div>
        )}
        
        {isHost && currentQ && (
          <div className="flex justify-center mt-8">
            <Button size="lg" onClick={handleAdvance}>
              Group Submit & Advance <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar Chat */}
      <div className="w-80 bg-card border-l flex flex-col shadow-xl">
        <div className="p-4 border-b font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Group Discussion
        </div>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {chat.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.user === (user?.username || user?.full_name) ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-muted-foreground mb-1">{msg.user}</span>
                <div className={`px-3 py-2 rounded-lg text-sm ${msg.user === (user?.username || user?.full_name) ? 'bg-violet-600 text-white rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-muted/10">
          <form onSubmit={sendChat} className="flex gap-2">
            <Input 
              placeholder="Discuss answer..." 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              className="flex-1 bg-card"
            />
            <Button type="submit" size="icon"><Send className="w-4 h-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Ensure Badge is imported (a minor hack to reuse it locally if not imported at top)
function Badge({ children, className, variant }: any) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}
