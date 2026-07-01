import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data: pollsData } = await supabase
        .from("virtual_classroom_polls")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
        
      if (pollsData) {
        setPolls(pollsData);
        
        // Fetch votes
        const pollIds = pollsData.map(p => p.id);
        if (pollIds.length > 0) {
          const { data: votesData } = await supabase
            .from("virtual_classroom_poll_votes")
            .select("*")
            .in("poll_id", pollIds);
            
          if (votesData) {
            const vMap: Record<string, any[]> = {};
            const mvMap: Record<string, number> = {};
            
            votesData.forEach(v => {
              if (!vMap[v.poll_id]) vMap[v.poll_id] = [];
              vMap[v.poll_id].push(v);
              
              if (v.user_id === user?.id) {
                mvMap[v.poll_id] = v.option_index;
              }
            });
            
            setVotes(vMap);
            setMyVotes(mvMap);
          }
        }
      }
    };
    
    fetchPolls();

    const channel = supabase.channel(`polls-${classroomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_classroom_polls', filter: `classroom_id=eq.${classroomId}` }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_classroom_poll_votes' }, fetchPolls)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.some(o => !o.trim()) || !user) return;
    
    await supabase.from("virtual_classroom_polls").insert({
      classroom_id: classroomId,
      created_by: user.id,
      question,
      options: options.map(o => o.trim())
    });
    
    setQuestion("");
    setOptions(["", ""]);
    setCreating(false);
  };

  const handleVote = async (pollId: string, index: number) => {
    if (!user || myVotes[pollId] !== undefined) return;
    
    await supabase.from("virtual_classroom_poll_votes").insert({
      poll_id: pollId,
      user_id: user.id,
      option_index: index
    });
  };

  const closePoll = async (pollId: string) => {
    await supabase.from("virtual_classroom_polls").update({ status: 'closed' }).eq("id", pollId);
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
                            <div className="flex justify-between relative z-10 gap-2">
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
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => closePoll(poll.id)}>
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
