import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Plus, CheckCircle2 } from "lucide-react";

export const PollsTab = ({ classroomId, isHost }: { classroomId: string, isHost: boolean }) => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, any[]>>({});
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/polls`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPolls(data.polls || []);
          setVotes(data.votes || {});
          setMyVotes(data.myVotes || {});
        }
      } catch {}
    };
    
    fetchPolls();
    const interval = setInterval(fetchPolls, 5000); // Polling for realtime updates
    return () => clearInterval(interval);
  }, [classroomId, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.some(o => !o.trim()) || !user) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/classrooms/${classroomId}/polls`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options: options.map(o => o.trim()) })
      });
      setQuestion("");
      setOptions(["", ""]);
      setCreating(false);
    } catch {}
  };

  const handleVote = async (pollId: string, index: number) => {
    if (!user || myVotes[pollId] !== undefined) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/classrooms/${classroomId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: index })
      });
    } catch {}
  };

  const closePoll = async (pollId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/classrooms/${classroomId}/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Polls List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {polls.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-4">No active polls.</p>
        ) : (
          polls.map(poll => {
            const pollVotes = votes[poll.id] || [];
            const totalVotes = pollVotes.length;
            const hasVoted = myVotes[poll.id] !== undefined;
            const isClosed = poll.status === 'closed';
            const showResults = isHost || hasVoted || isClosed;

            return (
              <div key={poll.id} className="p-4 border rounded-lg bg-card space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-medium text-sm leading-tight">{poll.question}</h4>
                  {isClosed && <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Closed</span>}
                </div>
                
                <div className="space-y-2">
                  {poll.options.map((opt: string, idx: number) => {
                    const optVotes = pollVotes.filter(v => v.option_index === idx).length;
                    const percent = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                    const iVoted = myVotes[poll.id] === idx;
                    
                    return (
                      <div key={idx} className="relative">
                        {!showResults ? (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left h-auto py-2 px-3 whitespace-normal"
                            onClick={() => handleVote(poll.id, idx)}
                            disabled={isClosed}
                          >
                            {opt}
                          </Button>
                        ) : (
                          <div className="w-full relative border rounded overflow-hidden p-2 text-sm z-0 bg-muted/30">
                            <div className="absolute inset-0 bg-primary/20 origin-left z-[-1]" style={{ width: `${percent}%` }} />
                            <div className="flex justify-between relative z-8 gap-2">
                              <span className="font-medium flex items-center gap-1.5">
                                {opt} {iVoted && <CheckCircle2 className="h-3 w-3 text-primary" />}
                              </span>
                              <span className="text-muted-foreground">{Math.round(percent)}% ({optVotes})</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {isHost && !isClosed && (
                  <Button variant="ghost" size="sm" className="w-full h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => closePoll(poll.id)}>
                    Close Poll
                  </Button>
                )}
                
                <p className="text-[10px] text-muted-foreground text-right">{totalVotes} votes</p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Form (Host Only) */}
      {isHost && (
        creating ? (
          <form onSubmit={handleCreate} className="space-y-3 p-3 border rounded-lg bg-card shrink-0">
            <Input 
              placeholder="Poll Question" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              required 
              className="h-8 text-sm font-medium"
            />
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  placeholder={`Option ${i + 1}`} 
                  value={opt} 
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }} 
                  required 
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs px-2" 
              onClick={() => setOptions([...options, ""])}
            >
              + Add Option
            </Button>
            <div className="flex gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="flex-1 h-8 text-xs">Launch</Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" className="w-full gap-2 shrink-0" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Create Poll
          </Button>
        )
      )}
    </div>
  );
};
