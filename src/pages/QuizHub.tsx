import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuizzes, type Quiz } from "@/hooks/useQuizHub";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Clock, Trophy, Target, Play, Plus, Loader2 } from "lucide-react";

const CATS = ["All", "CS Fundamentals", "Aptitude", "Advanced", "Mathematics", "General"];
const DIFFS = ["All", "easy", "medium", "hard"];
const MODES = ["All", "solo", "live"];

const QuizHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [mode, setMode] = useState("All");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { quizzes, loading } = useQuizzes({
    search: debouncedSearch || undefined,
    category: category !== "All" ? category : undefined,
    difficulty: difficulty !== "All" ? difficulty : undefined,
    mode: mode !== "All" ? mode : undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container mx-auto px-4 relative z-8">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Brain className="mr-1 h-3 w-3" /> Test Your Knowledge
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Quiz & <span className="text-foreground display-font">Mock Tests</span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Practice with timed quizzes built by the community. Real-time, scored, and saved.
                </p>
                <div className="flex justify-center gap-4">
                  <Button size="lg" className="h-12 px-8 text-lg" onClick={() => navigate('/live/join')}>
                    Join Live Quiz
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-3 mb-8 max-w-5xl mx-auto">
          <Input 
            placeholder="Search quizzes..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="md:w-1/3"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>{DIFFS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          {user && (
            <Button className="ml-auto" onClick={() => navigate('/quizzes/new')}>
              <Plus className="h-4 w-4 mr-2" />Create Quiz
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-border/50">
            <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz, index) => (
              <ScrollReveal key={quiz._id} delay={Math.min(0.05 * index, 0.3)}>
                <Card className="hover-scale h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{quiz.category}</Badge>
                      {quiz.mode === 'live' && (
                        <Badge variant="destructive" className="animate-pulse">Live</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold">{quiz.title}</h3>
                    {quiz.description && <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground" /><span>{quiz.question_count} Q</span></div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{quiz.durationMinutes} min</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={quiz.difficulty === "easy" ? "secondary" : quiz.difficulty === "medium" ? "default" : "destructive"}>
                        {quiz.difficulty}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1" title="Attempts"><Trophy className="h-3 w-3" /> {quiz.attemptCount}</div>
                        <div className="flex items-center gap-1" title="Avg Score">Score: {Math.round(quiz.averageScore)}%</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link to={`/quizzes/${quiz._id}`} className="w-full">
                      <Button className="w-full gap-2" disabled={quiz.question_count === 0}>
                        <Play className="h-4 w-4" /> View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHub;
