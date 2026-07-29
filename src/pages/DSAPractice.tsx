import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDSAProblems, useDSAProgress, useDSAMetadata, useToggleSolve, useResetDSAProgress } from "@/hooks/useDSA";
import { Loader2, Search, ExternalLink, RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DSAPractice = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("");
  const [company, setCompany] = useState("");

  const { data: problemsData, isLoading: problemsLoading } = useDSAProblems(page, search, difficulty, topic, company);
  const { data: progressData, isLoading: progressLoading } = useDSAProgress();
  const { data: metadata } = useDSAMetadata();
  const { mutate: toggleSolve } = useToggleSolve();
  const { mutate: resetProgress, isPending: isResetting } = useResetDSAProgress();

  const [isResetOpen, setIsResetOpen] = useState(false);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const isSolved = (id: string) => progressData?.solved_problems.includes(id) || false;

  const handleToggle = (id: string, checked: boolean) => {
    toggleSolve({ id, solved: checked });
  };

  const handleReset = () => {
    resetProgress(undefined, {
      onSuccess: () => setIsResetOpen(false)
    });
  };

  const percentComplete = progressData && progressData.totalProblems > 0 
    ? Math.round((progressData.solved_problems.length / progressData.totalProblems) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/placement')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DSA Practice</h1>
            <p className="text-muted-foreground mt-1">Curated data structures and algorithms problems for interviews.</p>
          </div>
        </div>

        {/* Progress Bar Section */}
        <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Your Progress</h2>
              <p className="text-sm text-muted-foreground">
                {progressLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : progressData?.solved_problems.length || 0} / {progressData?.totalProblems || 0} problems solved
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">{percentComplete}%</span>
              <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    <RefreshCw className="mr-2 h-3 w-3" /> Reset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center text-destructive">
                      <AlertTriangle className="mr-2 h-5 w-5" /> Reset Progress
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to reset your DSA progress? This will unmark all solved problems and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                      {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, Reset Progress'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Progress value={percentComplete} className="h-3" />
        </Card>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search problems..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          
          <Select value={difficulty} onValueChange={(v) => { setDifficulty(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={topic} onValueChange={(v) => { setTopic(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {metadata?.topics.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={company} onValueChange={(v) => { setCompany(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {metadata?.companies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Problem List */}
        <div className="border rounded-lg bg-card">
          <div className="grid grid-cols-[40px_1fr_100px_100px_100px] gap-4 p-4 border-b bg-muted/50 font-medium text-sm text-muted-foreground">
            <div className="flex justify-center">Status</div>
            <div>Problem</div>
            <div className="hidden sm:block">Difficulty</div>
            <div className="hidden sm:block">Topic</div>
            <div className="hidden md:flex justify-end">Action</div>
          </div>

          {problemsLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : problemsData?.problems.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No problems found matching your filters.
            </div>
          ) : (
            <div className="divide-y">
              {problemsData?.problems.map((problem) => {
                const solved = isSolved(problem._id);
                return (
                  <div key={problem._id} className={`grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_1fr_100px_100px_100px] gap-4 p-4 items-center hover:bg-secondary/20 transition-colors ${solved ? 'opacity-70' : ''}`}>
                    <div className="flex justify-center">
                      <Checkbox 
                        checked={solved} 
                        onCheckedChange={(c) => handleToggle(problem._id, c as boolean)}
                        className="h-5 w-5 rounded-md"
                      />
                    </div>
                    <div>
                      <div className={`font-medium ${solved ? 'line-through text-muted-foreground' : ''}`}>{problem.title}</div>
                      <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                        <Badge variant="outline" className={`text-[10px] ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</Badge>
                        <Badge variant="outline" className="text-[10px]">{problem.topic}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {problem.companies.map(c => (
                          <Badge key={c} variant="secondary" className="text-[10px] bg-secondary/50">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <Badge variant="outline" className={`${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</Badge>
                    </div>
                    <div className="hidden sm:block text-sm text-muted-foreground">
                      {problem.topic}
                    </div>
                    <div className="hidden sm:flex justify-end">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={problem.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {problemsData && problemsData.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button 
              variant="outline" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {problemsData.totalPages}
            </span>
            <Button 
              variant="outline" 
              disabled={page === problemsData.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

      </main>
    </div>
  );
};

export default DSAPractice;
