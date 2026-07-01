import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ThumbsUp, Send, CheckCircle2 } from "lucide-react";

export const QATab = ({ classroomId, isHost }: { classroomId: string, isHost: boolean }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    const fetchQA = async () => {
      const { data: qData } = await supabase
        .from("virtual_classroom_qa")
        .select(`
          *,
          user:profiles!virtual_classroom_qa_user_id_fkey(full_name, username)
        `)
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: true });
        
      if (qData) {
        setQuestions(qData);
        
        const qIds = qData.map(q => q.id);
        if (qIds.length > 0) {
          const { data: vData } = await supabase
            .from("virtual_classroom_qa_votes")
            .select("*")
            .in("qa_id", qIds);
            
          if (vData) {
            const vMap: Record<string, number> = {};
            const mvMap: Record<string, boolean> = {};
            
            vData.forEach(v => {
              vMap[v.qa_id] = (vMap[v.qa_id] || 0) + 1;
              if (v.user_id === user?.id) {
                mvMap[v.qa_id] = true;
              }
            });
            
            setVotes(vMap);
            setMyVotes(mvMap);
          }
        }
      }
    };
    
    fetchQA();

    const channel = supabase.channel(`qa-${classroomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_classroom_qa', filter: `classroom_id=eq.${classroomId}` }, fetchQA)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_classroom_qa_votes' }, fetchQA)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) return;
    
    await supabase.from("virtual_classroom_qa").insert({
      classroom_id: classroomId,
      user_id: user.id,
      question: newQuestion.trim()
    });
    
    setNewQuestion("");
  };

  const handleUpvote = async (qaId: string) => {
    if (!user || myVotes[qaId]) return;
    
    // Optimistic UI
    setMyVotes(prev => ({ ...prev, [qaId]: true }));
    setVotes(prev => ({ ...prev, [qaId]: (prev[qaId] || 0) + 1 }));
    
    await supabase.from("virtual_classroom_qa_votes").insert({
      qa_id: qaId,
      user_id: user.id
    });
  };

  const markAnswered = async (qaId: string) => {
    await supabase.from("virtual_classroom_qa").update({ is_answered: true }).eq("id", qaId);
  };

  // Sort: Unanswered first, then by upvotes (desc), then chronologically
  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.is_answered !== b.is_answered) return a.is_answered ? 1 : -1;
    const votesA = votes[a.id] || 0;
    const votesB = votes[b.id] || 0;
    if (votesA !== votesB) return votesB - votesA;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* QA List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {sortedQuestions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-4">No questions asked yet.</p>
        ) : (
          sortedQuestions.map(q => {
            const upvotes = votes[q.id] || 0;
            const hasUpvoted = myVotes[q.id];
            const authorName = q.user?.full_name || q.user?.username || "Student";
            
            return (
              <div key={q.id} className={`p-3 border rounded-lg ${q.is_answered ? 'bg-muted/30 opacity-75' : 'bg-card'}`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium text-sm flex-1 break-words">{q.question}</p>
                  <Button 
                    variant={hasUpvoted ? "secondary" : "ghost"} 
                    size="sm" 
                    className={`h-7 px-2 shrink-0 ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
                    onClick={() => handleUpvote(q.id)}
                    disabled={q.is_answered || hasUpvoted}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1.5" />
                    <span className="text-xs">{upvotes}</span>
                  </Button>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <span className="text-[10px] text-muted-foreground">Asked by {authorName}</span>
                  {isHost && !q.is_answered && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => markAnswered(q.id)}>
                      Mark Answered
                    </Button>
                  )}
                  {q.is_answered && (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Answered
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ask Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <Input 
          placeholder="Ask a question..." 
          value={newQuestion} 
          onChange={(e) => setNewQuestion(e.target.value)} 
          className="text-sm"
        />
        <Button type="submit" size="icon" className="shrink-0" disabled={!newQuestion.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
