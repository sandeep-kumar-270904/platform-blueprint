import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckCircle2, Circle, ArrowRight, Loader2, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function AILearningPaths() {
  const [paths, setPaths] = useState<any[]>([]);
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const fetchPaths = async () => {
    try {
      const res = await api.get('/ai-paths/my-paths');
      setPaths(res.data.paths);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !category) return;
    setIsGenerating(true);
    try {
      await api.post('/ai-paths/generate', { goal, category });
      setGoal("");
      setCategory("");
      fetchPaths();
    } catch (e) {
      console.error(e);
      alert("Failed to generate path");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkComplete = async (pathId: string, stepId: string, completed: boolean) => {
    try {
      await api.patch(`/ai-paths/${pathId}/steps/${stepId}/complete`, { completed });
      fetchPaths();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <BrainCircuit className="w-8 h-8 text-purple-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            AI Personalized Learning Paths
          </h1>
          <p className="text-muted-foreground mt-1">Let AI craft a step-by-step roadmap to achieve your specific goals.</p>
        </div>
      </div>

      <Card className="border-purple-500/20 shadow-lg shadow-purple-500/5 bg-gradient-to-br from-card to-purple-900/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" /> What do you want to achieve?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
            <Input 
              placeholder="e.g. Master React and get a Frontend Developer job" 
              className="flex-1"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              required
            />
            <Input 
              placeholder="Category (e.g. Software Engineering)" 
              className="w-full md:w-64"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            />
            <Button type="submit" disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : 'Generate Path'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Active Paths</h2>
        
        {paths.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
            No active learning paths yet. Create one above!
          </div>
        ) : (
          paths.map(path => (
            <Card key={path._id} className="overflow-hidden border-l-4 border-l-purple-500">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{path.goal}</CardTitle>
                    <Badge variant="outline">{path.category}</Badge>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {path.generatedSteps.filter((s: any) => s.completed).length} / {path.generatedSteps.length} Steps Completed
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {path.generatedSteps.map((step: any, index: number) => (
                    <div key={step._id} className={`p-4 flex gap-4 items-start transition-colors ${step.completed ? 'bg-muted/10' : 'hover:bg-muted/20'}`}>
                      <button 
                        onClick={() => handleMarkComplete(path._id, step._id, !step.completed)}
                        className="mt-1 flex-shrink-0 text-muted-foreground hover:text-purple-500 transition-colors"
                      >
                        {step.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-muted-foreground">STEP {index + 1}</span>
                          <h4 className={`font-semibold text-lg \${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {step.title}
                          </h4>
                        </div>
                        <p className={`text-muted-foreground \${step.completed ? 'opacity-70' : ''}`}>
                          {step.description}
                        </p>
                        
                        {!step.completed && step.suggestedAction && (
                          <div className="mt-3 flex gap-2">
                            {step.suggestedAction === 'book_mentor' && step.targetId && (
                              <Button size="sm" variant="secondary" onClick={() => navigate(`/mentors/\${step.targetId}`)}>
                                Book Mentor Session <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                            {step.suggestedAction === 'take_quiz' && step.targetId && (
                              <Button size="sm" variant="secondary" onClick={() => navigate(`/quiz/\${step.targetId}`)}>
                                Take Assessment <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                            <Badge variant="outline" className="ml-auto capitalize">
                              {step.suggestedAction.replace('_', ' ')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
