import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createQuiz, importQuestions, draftQuestionsWithAI } from "@/hooks/useQuizHub";
import { Plus, Trash2, ArrowLeft, Loader2, Upload, Download, Library, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATS = ["CS Fundamentals", "Aptitude", "Advanced", "Mathematics", "General"];
const DIFFS = ["easy", "medium", "hard"];
const MODES = ["solo", "live"];

const QuizCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATS[0]);
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode] = useState("solo");
  const [durationMinutes, setDurationMinutes] = useState(15);
  
  const [questions, setQuestions] = useState([
    { questionText: "", options: ["", ""], correctOptionIndex: 0, explanation: "", points: 1 }
  ]);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{successful: number, failed: number, errors: any[]} | null>(null);

  const [bankOpen, setBankOpen] = useState(false);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());

  const fetchBank = async () => {
    setLoadingBank(true);
    try {
      const res = await fetch(`${API_URL}/api/question-bank/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBankItems(data.items);
      }
    } catch (err) {
      toast.error("Failed to fetch bank items");
    } finally {
      setLoadingBank(false);
    }
  };

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiTopic) return toast.error("Please enter a topic");
    setGenerating(true);
    try {
      const res = await draftQuestionsWithAI(aiTopic, difficulty, aiCount);
      if (res.questions && res.questions.length > 0) {
        setQuestions(prev => {
          const qs = [...prev];
          if (qs.length === 1 && qs[0].questionText === "" && qs[0].options[0] === "") {
            return res.questions;
          }
          return [...qs, ...res.questions];
        });
        toast.success(`Generated ${res.questions.length} questions`);
        setAiOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error("Please select a file");
    setImporting(true);
    try {
      const res = await importQuestions(importFile);
      setImportResults(res.results);
      if (res.questions && res.questions.length > 0) {
        setQuestions(prev => {
          const qs = [...prev];
          if (qs.length === 1 && qs[0].questionText === "" && qs[0].options[0] === "") {
            return res.questions;
          }
          return [...qs, ...res.questions];
        });
        toast.success(`Successfully imported ${res.results.successful} questions`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleAddFromBank = () => {
    const selected = bankItems.filter(i => selectedBankIds.has(i._id));
    if (selected.length === 0) return toast.error("Select at least one question");
    
    const mapped = selected.map(item => ({
      questionText: item.questionText,
      options: item.options,
      correctOptionIndex: item.correctOptionIndex,
      explanation: item.explanation,
      points: item.points
    }));

    setQuestions(prev => {
      const qs = [...prev];
      if (qs.length === 1 && qs[0].questionText === "" && qs[0].options[0] === "") {
        return mapped;
      }
      return [...qs, ...mapped];
    });
    
    toast.success(`Added ${mapped.length} questions from bank`);
    setBankOpen(false);
    setSelectedBankIds(new Set());
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { questionText: "", options: ["", ""], correctOptionIndex: 0, explanation: "", points: 1 }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return toast.error("Must have at least one question");
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => {
      const qs = [...prev];
      qs[idx] = { ...qs[idx], [field]: value };
      return qs;
    });
  };

  const addOption = (qIdx: number) => {
    if (questions[qIdx].options.length >= 6) return toast.error("Max 6 options allowed");
    setQuestions(prev => {
      const qs = [...prev];
      qs[qIdx].options.push("");
      return qs;
    });
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    if (questions[qIdx].options.length <= 2) return toast.error("Min 2 options required");
    setQuestions(prev => {
      const qs = [...prev];
      qs[qIdx].options = qs[qIdx].options.filter((_, i) => i !== optIdx);
      if (qs[qIdx].correctOptionIndex >= qs[qIdx].options.length) {
        qs[qIdx].correctOptionIndex = 0;
      }
      return qs;
    });
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions(prev => {
      const qs = [...prev];
      qs[qIdx].options[optIdx] = value;
      return qs;
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (durationMinutes < 1) return toast.error("Duration must be at least 1 minute");
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return toast.error(`Question ${i+1} text is required`);
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) return toast.error(`Question ${i+1} Option ${j+1} is empty`);
      }
    }

    setSaving(true);
    try {
      const res = await createQuiz({
        title,
        description,
        category,
        difficulty: difficulty as any,
        mode: mode as any,
        durationMinutes,
        questions,
        status: 'published' // auto publish for phase 1 as requested
      });
      toast.success("Quiz created successfully!");
      navigate(`/quizzes/${res._id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/quizzes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quizzes
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Create New Quiz</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Quiz Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Advanced React Patterns" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this quiz about?" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DIFFS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (mins)</Label>
                  <Input type="number" min={1} value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value) || 1)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Questions</h2>
            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="relative overflow-visible">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-md"
                  onClick={() => removeQuestion(qIdx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-4 items-start">
                    <span className="font-bold text-xl mt-1 text-muted-foreground">{qIdx + 1}.</span>
                    <div className="flex-1 space-y-4">
                      <Input 
                        value={q.questionText} 
                        onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)} 
                        placeholder="Type your question here..."
                        className="text-lg font-medium"
                      />
                      
                      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-3 items-center">
                            <input 
                              type="radio" 
                              name={`correct-${qIdx}`} 
                              checked={q.correctOptionIndex === optIdx}
                              onChange={() => updateQuestion(qIdx, 'correctOptionIndex', optIdx)}
                              className="h-5 w-5 text-primary focus:ring-primary border-muted-foreground"
                            />
                            <Input 
                              value={opt} 
                              onChange={e => updateOption(qIdx, optIdx, e.target.value)} 
                              placeholder={`Option ${optIdx + 1}`}
                            />
                            {q.options.length > 2 && (
                              <Button variant="ghost" size="icon" onClick={() => removeOption(qIdx, optIdx)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <Button variant="outline" size="sm" onClick={() => addOption(qIdx)} className="mt-2">
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        )}
                      </div>

                      <div className="pt-4 space-y-2">
                        <Label>Explanation (shown after completion, optional)</Label>
                        <Textarea 
                          value={q.explanation} 
                          onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)} 
                          placeholder="Explain why the correct answer is right..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 py-8 border-dashed border-2" onClick={addQuestion}>
                <Plus className="h-5 w-5 mr-2" /> Add Another Question
              </Button>
              <Dialog open={bankOpen} onOpenChange={(open) => {
                setBankOpen(open);
                if (open) fetchBank();
                else setSelectedBankIds(new Set());
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 py-8 border-dashed border-2 bg-muted/50 text-indigo-700 hover:text-indigo-800 border-indigo-200">
                    <Library className="h-5 w-5 mr-2" /> Pick from Bank
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Personal Question Bank</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {loadingBank ? (
                      <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : bankItems.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Your question bank is empty.</p>
                    ) : (
                      <div className="space-y-3">
                        {bankItems.map(item => (
                          <div key={item._id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                            <input 
                              type="checkbox" 
                              className="mt-1 h-4 w-4"
                              checked={selectedBankIds.has(item._id)}
                              onChange={(e) => {
                                const s = new Set(selectedBankIds);
                                if (e.target.checked) s.add(item._id);
                                else s.delete(item._id);
                                setSelectedBankIds(s);
                              }}
                            />
                            <div>
                              <p className="font-medium text-sm">{item.questionText}</p>
                              <p className="text-xs text-muted-foreground">{item.category} • {item.points} pts</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBankOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddFromBank} disabled={selectedBankIds.size === 0}>
                      Add Selected ({selectedBankIds.size})
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={importOpen} onOpenChange={(open) => {
                setImportOpen(open);
                if (!open) {
                  setImportFile(null);
                  setImportResults(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 py-8 border-dashed border-2 bg-muted/50">
                    <Upload className="h-5 w-5 mr-2" /> Import from Spreadsheet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Questions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-md">
                      <div className="text-sm">
                        <p className="font-semibold">Format Requirements:</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-1">
                          <li>CSV file only</li>
                          <li>2 to 6 options per question</li>
                          <li>correctOptionNumber (1-based)</li>
                        </ul>
                      </div>
                      <a href={`${API_URL}/api/quizzes/import-template`} download>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" /> Template
                        </Button>
                      </a>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Select CSV File</Label>
                      <Input 
                        type="file" 
                        accept=".csv" 
                        onChange={e => setImportFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {importResults && (
                      <div className="mt-4 p-4 rounded-md bg-muted">
                        <p className="font-semibold mb-2">Import Results:</p>
                        <p className="text-sm text-green-600 font-medium">✓ {importResults.successful} imported successfully</p>
                        {importResults.failed > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-red-600 font-medium">✗ {importResults.failed} failed</p>
                            <ul className="text-xs text-red-600/80 list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                              {importResults.errors.map((e, i) => (
                                <li key={i}>Row {e.row}: {e.error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setImportOpen(false)}>Close</Button>
                    <Button onClick={handleImport} disabled={importing || !importFile}>
                      {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Import
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 py-8 border-dashed border-2 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-purple-700 border-purple-200">
                    <Sparkles className="h-5 w-5 mr-2" /> Generate with AI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Question Generator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Input 
                        placeholder="e.g. React Hooks, World War 2, Basic Calculus..." 
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Questions (Max 20)</Label>
                      <Input 
                        type="number" 
                        min={1} 
                        max={20}
                        value={aiCount}
                        onChange={e => setAiCount(parseInt(e.target.value) || 5)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      The generator will use your currently selected quiz difficulty ({difficulty}).
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAiOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateAI} disabled={generating || !aiTopic}>
                      {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Generate
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex justify-end pt-6 pb-12">
            <Button size="lg" onClick={handleSubmit} disabled={saving} className="w-full md:w-auto px-12">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreate;
