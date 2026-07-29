import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ThumbsUp, Award, Search, Plus, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { useQuestions, createQuestion, useAnswers, postAnswer, incrementQuestionViews, type QAQuestion } from "@/hooks/useQABoard";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = ["All", "General", "Placements", "Technology", "Study Tips", "Projects", "Internships"];

const QABoard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<QAQuestion | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { questions, loading, status, handleVote } = useQuestions(category, debouncedSearch, showUnanswered);
  const [form, setForm] = useState({ title: "", body: "", category: "General", tagInput: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    const tags = form.tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    const res = await createQuestion({ title: form.title.trim(), body: form.body.trim(), category: form.category, tags });
    setSubmitting(false);
    if (res) {
      setCreateOpen(false);
      setForm({ title: "", body: "", category: "General", tagInput: "" });
    }
  };

  const openQuestion = (q: QAQuestion) => {
    setSelected(q);
    incrementQuestionViews(q.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 flex flex-col items-center text-center gap-4">
          <Badge><MessageSquare className="mr-1 h-3 w-3" />Community Q&A</Badge>
          <h1 className="text-4xl md:text-5xl font-bold">Ask, Learn & Grow Together</h1>
          <p className="text-muted-foreground max-w-2xl">Get answers from peers and experts. Real-time updates, atomic vote counts.</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user}><Plus className="mr-2 h-4 w-4" />Ask Question</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Ask a Question</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Question title*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
                  <Textarea placeholder="Describe your question in detail*" rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={5000} />
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Input placeholder="Tags (comma separated)" value={form.tagInput} onChange={(e) => setForm({ ...form, tagInput: e.target.value })} />
                  <Button className="w-full" onClick={submit} disabled={submitting || !form.title.trim() || !form.body.trim()}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</> : "Post Question"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <SyncStatusIndicator status={status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center items-center">
          {CATEGORIES.map((c) => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>{c}</Button>
          ))}
          <div className="h-6 w-px bg-border mx-2"></div>
          <Button size="sm" variant={showUnanswered ? "secondary" : "outline"} onClick={() => setShowUnanswered(!showUnanswered)}>
            Unanswered
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : questions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No questions yet. Be the first to ask!</CardContent></Card>
          ) : questions.map((q) => (
            <Card key={q.id} className="hover:shadow-md cursor-pointer transition-all" onClick={() => openQuestion(q)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{q.category}</Badge>
                      {q.is_resolved && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Resolved</Badge>}
                      {q.is_pinned && <Badge variant="outline">📌 Pinned</Badge>}
                    </div>
                    <h3 className="text-lg font-bold hover:text-primary transition-colors">{q.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.body}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-6 w-6"><AvatarImage src={q.author?.avatar_url || ""} /><AvatarFallback>{(q.author?.full_name || q.author?.username || "?")[0]}</AvatarFallback></Avatar>
                    <span>{q.author?.full_name || q.author?.username || "Anonymous"} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary" onClick={(e) => { e.stopPropagation(); handleVote(q.id); }}>
                      <ThumbsUp className="h-4 w-4" /><span data-testid={`q-upvotes-${q.id}`}>{q.upvotes}</span>
                    </button>
                    <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{q.answer_count}</span>
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{q.view_count}</span>
                  </div>
                </div>
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {q.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <QuestionDialog question={selected} onClose={() => setSelected(null)} handleQuestionVote={handleVote} />
    </div>
  );
};

const QuestionDialog = ({ question, onClose, handleQuestionVote }: { question: QAQuestion | null; onClose: () => void; handleQuestionVote: (id: string) => void }) => {
  const { user } = useAuth();
  const { answers, loading, handleVote: handleAnswerVote } = useAnswers(question?.id || null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  if (!question) return null;

  const submit = async () => {
    setPosting(true);
    const res = await postAnswer(question.id, body);
    setPosting(false);
    if (res) setBody("");
  };

  return (
    <Dialog open={!!question} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2"><Badge variant="secondary">{question.category}</Badge></div>
          <DialogTitle className="text-xl">{question.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">{question.body}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>by {question.author?.full_name || "Anonymous"} · {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
              <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleQuestionVote(question.id)}>
                <ThumbsUp className="h-3 w-3" />{question.upvotes}
              </button>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">{answers.length} Answer{answers.length !== 1 ? "s" : ""}</h4>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : answers.map((a) => (
                <div key={a.id} className="border rounded-lg p-3 mb-3">
                  {a.is_accepted && <Badge className="mb-2 gap-1"><Award className="h-3 w-3" />Accepted</Badge>}
                  <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{a.author?.full_name || "Anonymous"} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                    <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleAnswerVote(a.id)}>
                      <ThumbsUp className="h-3 w-3" />{a.upvotes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        {user && (
          <div className="border-t pt-3 space-y-2">
            <Textarea placeholder="Your answer..." value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={5000} />
            <Button onClick={submit} disabled={posting || !body.trim()} className="w-full">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Answer"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QABoard;
