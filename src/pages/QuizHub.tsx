import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useSyncStatusToast } from "@/hooks/useSyncStatusToast";
import { useQuizzes, fetchQuizQuestions, createQuiz, recordAttempt, type Quiz, type QuizQuestion } from "@/hooks/useQuizHub";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Clock, Trophy, Target, Play, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const CATS = ["CS Fundamentals", "Aptitude", "Advanced", "Mathematics", "General"];
const DIFFS = ["Easy", "Medium", "Hard"];

const QuizHub = () => {
  const { user } = useAuth();
  const { quizzes, loading, status } = useQuizzes();
  useSyncStatusToast(status, "Quiz Hub");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [playing, setPlaying] = useState<{ quiz: Quiz; questions: QuizQuestion[] } | null>(null);

  const filtered = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase())
  );

  const startQuiz = async (quiz: Quiz) => {
    const qs = await fetchQuizQuestions(quiz.id);
    if (!qs.length) return toast.error("This quiz has no questions yet");
    setPlaying({ quiz, questions: qs });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-8">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <div className="flex justify-center mb-4">
                  <SyncStatusIndicator status={status} />
                </div>
                <Badge variant="accent" className="mb-6">
                  <Brain className="mr-1 h-3 w-3" /> Test Your Knowledge
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Quiz &{" "}
                  <span className="text-foreground display-font">
                    Mock Tests
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Practice with timed quizzes built by the community. Real-time, scored, and saved.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-3 mb-8 max-w-4xl mx-auto">
          <Input placeholder="Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {user && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Create Quiz</Button>
              </DialogTrigger>
              <CreateQuizDialog onClose={() => setCreateOpen(false)} />
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No quizzes yet. Be the first to create one!</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((quiz, index) => (
              <ScrollReveal key={quiz.id} delay={Math.min(0.05 * index, 0.3)}>
                <Card className="hover-scale h-full flex flex-col">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">{quiz.category}</Badge>
                    <h3 className="text-xl font-bold">{quiz.title}</h3>
                    {quiz.description && <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground" /><span>{quiz.question_count} Q</span></div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{quiz.duration_minutes} min</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={quiz.difficulty === "Easy" ? "secondary" : quiz.difficulty === "Medium" ? "default" : "destructive"}>
                        {quiz.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4" /><span>{quiz.attempts_count}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full gap-2" onClick={() => startQuiz(quiz)} disabled={quiz.question_count === 0}>
                      <Play className="h-4 w-4" /> Start Quiz
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      {playing && <PlayQuizDialog quiz={playing.quiz} questions={playing.questions} onClose={() => setPlaying(null)} />}
    </div>
  );
};

const CreateQuizDialog = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATS[0]);
  const [difficulty, setDifficulty] = useState(DIFFS[1]);
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct_index: number; explanation?: string }[]>([
    { question: "", options: ["", "", "", ""], correct_index: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const updateQ = (i: number, patch: Partial<(typeof questions)[number]>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const updateOption = (qi: number, oi: number, val: string) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q)));

  const submit = async () => {
    if (!title.trim()) return toast.error("Title required");
    const valid = questions.filter((q) => q.question.trim() && q.options.every((o) => o.trim()));
    if (!valid.length) return toast.error("Add at least one complete question");
    setSaving(true);
    try {
      await createQuiz({ title: title.trim(), description: description.trim() || undefined, category, difficulty, duration_minutes: duration, questions: valid });
      toast.success("Quiz published!");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Create a Quiz</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="duration-min">Duration (min)</Label><Input id="duration-min" type="number" min={1} max={300} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 30)} /></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Questions</Label>
            <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, { question: "", options: ["", "", "", ""], correct_index: 0 }])}>
              <Plus className="h-3 w-3 mr-1" />Add
            </Button>
          </div>
          {questions.map((q, i) => (
            <Card key={i} className="p-3 space-y-2">
              <Input placeholder={`Question ${i + 1}`} value={q.question} onChange={(e) => updateQ(i, { question: e.target.value })} maxLength={300} />
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => updateQ(i, { correct_index: oi })} />
                  <Input placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} maxLength={200} />
                </div>
              ))}
            </Card>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Publish</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const PlayQuizDialog = ({ quiz, questions, onClose }: { quiz: Quiz; questions: QuizQuestion[]; onClose: () => void }) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<{ score: number; total: number } | null>(null);
  const [startTs] = useState(Date.now());
  const q = questions[idx];

  const choose = (oi: number) => {
    const next = [...answers, oi];
    setAnswers(next);
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else {
      const score = next.reduce((s, ans, i) => s + (ans === questions[i].correct_index ? 1 : 0), 0);
      const seconds = Math.round((Date.now() - startTs) / 1000);
      recordAttempt(quiz.id, score, questions.length, seconds, next).catch(() => {});
      setDone({ score, total: questions.length });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{quiz.title}</DialogTitle></DialogHeader>
        {done ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">{done.score} / {done.total}</h3>
            <p className="text-muted-foreground mb-6">{Math.round((done.score / done.total) * 100)}% correct</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Progress value={((idx) / questions.length) * 100} />
            <p className="text-sm text-muted-foreground">Question {idx + 1} of {questions.length}</p>
            <h3 className="text-lg font-semibold">{q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <Button key={oi} variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => choose(oi)}>
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuizHub;
