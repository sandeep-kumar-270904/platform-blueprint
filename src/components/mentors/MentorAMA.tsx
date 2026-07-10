import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAMASessions, useAMAQuestions } from "@/hooks/useAMA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Users, MessageSquare, Clock, CheckCircle2, Pin, Send, Calendar, Radio, ArrowUp, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusBadge = (s: string) => {
  if (s === "live") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"><Radio className="mr-1 h-3 w-3" />LIVE</Badge>;
  if (s === "upcoming") return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Upcoming</Badge>;
  return <Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" />Ended</Badge>;
};

export const MentorAMA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sessions, loading } = useAMASessions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { questions, askQuestion, toggleVote } = useAMAQuestions(selectedId, user?.id);
  const [newQ, setNewQ] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [questions.length]);

  const join = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ama/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        if (!data.message?.includes("duplicate")) {
          toast({ title: "Could not join", description: data.message, variant: "destructive" });
        }
      }
      setSelectedId(id);
    } catch (error: any) {
      toast({ title: "Could not join", description: error.message, variant: "destructive" });
    }
  };

  const ask = async () => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    setSubmitting(true);
    const { error } = await askQuestion(newQ);
    setSubmitting(false);
    if (error) return toast({ title: "Could not post", description: error.message, variant: "destructive" });
    setNewQ("");
    toast({ title: "Question posted 🙋" });
  };

  const selected = sessions.find((s) => s.id === selectedId);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      {!selectedId ? (
        <>
          <div>
            <h2 className="text-2xl font-bold">Mentor AMA Sessions</h2>
            <p className="text-muted-foreground">Live Q&A with industry experts</p>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No AMAs scheduled</h3>
              <p className="text-sm text-muted-foreground">Check back soon — mentors host AMAs every week.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {sessions.map((s, i) => (
                <ScrollReveal key={s.id} delay={i * 0.05}>
                  <Card className="card-hover bg-card/50 border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={s.mentor_profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-primary-foreground text-sm">
                              {(s.mentor_profile?.full_name || s.mentor_profile?.username || "M").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{s.mentor_profile?.full_name || s.mentor_profile?.username}</p>
                            {s.mentor_meta && <p className="text-xs text-muted-foreground">{s.mentor_meta.title}{s.mentor_meta.company ? ` · ${s.mentor_meta.company}` : ""}</p>}
                          </div>
                        </div>
                        {statusBadge(s.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <CardTitle className="text-lg mb-1">{s.title}</CardTitle>
                        {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{s.topic}</Badge>
                        <Badge variant="secondary" className="text-xs"><Clock className="mr-1 h-3 w-3" />{s.duration_minutes} min</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{s.status === "live" ? "Now" : format(new Date(s.scheduled_at), "MMM d, h:mm a")}</span></div>
                        <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{s.participant_count}/{s.max_participants}</span></div>
                      </div>
                      <Button className="w-full" variant={s.status === "live" ? "default" : "outline"} onClick={() => join(s.id)}>
                        {s.status === "live" ? <><Radio className="mr-2 h-4 w-4" />Join Live</> : <><Calendar className="mr-2 h-4 w-4" />RSVP</>}
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Back</Button>

          {selected && (
            <Card className="bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={selected.mentor_profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-primary-foreground">
                        {(selected.mentor_profile?.full_name || "M").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{selected.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">with <span className="text-primary font-medium">{selected.mentor_profile?.full_name || selected.mentor_profile?.username}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{statusBadge(selected.status)}<Badge variant="secondary"><Users className="mr-1 h-3 w-3" />{selected.participant_count}</Badge></div>
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Questions ({questions.length})</h3>
              <div ref={scrollRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No questions yet. Be the first to ask!</p>
                  ) : (
                    questions.map((q) => (
                      <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Card className={`bg-card/50 ${q.is_pinned ? "ring-1 ring-primary/30" : ""} ${q.is_answered ? "border-l-2 border-l-green-500" : ""}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <Avatar className="h-8 w-8"><AvatarImage src={q.user_profile?.avatar_url || ""} /><AvatarFallback className="text-xs">{(q.user_profile?.username || "U")[0]}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{q.user_profile?.full_name || q.user_profile?.username || "User"}</span>
                                    {q.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                                    {q.is_answered && <Badge className="text-[10px] h-5 bg-green-500/20 text-green-400">Answered</Badge>}
                                  </div>
                                  <p className="text-sm">{q.question}</p>
                                </div>
                              </div>
                              <Button variant={q.has_voted ? "default" : "ghost"} size="sm" className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-2" onClick={() => toggleVote(q.id)} disabled={!user}>
                                <ArrowUp className="h-4 w-4" />
                                <span className="text-xs font-bold">{q.upvotes}</span>
                              </Button>
                            </div>
                            {q.answer && (
                              <div className="ml-11 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 mb-1"><Mic className="h-3 w-3 text-primary" /><span className="text-xs font-semibold text-primary">Mentor's Answer</span></div>
                                <p className="text-sm text-muted-foreground">{q.answer}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Ask a Question</h3>
              <Textarea placeholder="Ask the mentor..." value={newQ} onChange={(e) => setNewQ(e.target.value.slice(0, 500))} rows={4} />
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{newQ.length}/500</span></div>
              <Button className="w-full" onClick={ask} disabled={submitting || newQ.trim().length < 5 || !user}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Post</>}
              </Button>
              {!user && <p className="text-xs text-muted-foreground text-center">Sign in to ask and vote</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
