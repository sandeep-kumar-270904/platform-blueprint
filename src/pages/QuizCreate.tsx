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
import { createQuiz, importQuestions, draftQuestionsWithAI, checkQuestionWithAI } from "@/hooks/useQuizHub";
import { Plus, Trash2, ArrowLeft, Loader2, Upload, Download, Library, Sparkles, CheckCircle, XCircle, Bot } from "lucide-react";
import { toast } from "sonner";
import { AIGenerationModal } from "@/components/quizzes/AIGenerationModal";


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
  
  const [questions, setQuestions] = useState<any[]>([
    { questionText: "", options: ["", ""], correctOptionIndex: 0, explanation: "", points: 1 }
  ]);

  const [aiDrafts, setAiDrafts] = useState<any[]>([]);
  const [checkingAi, setCheckingAi] = useState<Record<number, boolean>>({});
  const [aiFeedback, setAiFeedback] = useState<Record<number, { issuesFound: boolean, feedback: string }>>({});

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{successful: number, failed: number, errors: any[]} | null>(null);

  const [bankOpen, setBankOpen] = useState(false);
  const [bankItems, setBankItems] = useState<any[]>([]); // These are banks now
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  const fetchBank = async () => {
    setLoadingBank(true);
    try {
      const res = await fetch(`${API_URL}/api/question-bank/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBankItems(data.banks || []); // It's banks now
      }
    } catch (err) {
      toast.error("Failed to fetch bank items");
    } finally {
      setLoadingBank(false);
    }
  };

  // ... (AI code left unchanged for now) ...
  const [aiOpen, setAiOpen] = useState(false);

  const handleApproveDraft = (idx: number) => {
    const q = aiDrafts[idx];
    setQuestions(prev => {
      const qs = [...prev];
      if (qs.length === 1 && qs[0].questionText === "" && qs[0].options[0] === "") {
        return [q];
      }
      return [...qs, q];
    });
    setAiDrafts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRejectDraft = (idx: number) => {
    setAiDrafts(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDraft = (idx: number, field: string, value: any) => {
    setAiDrafts(prev => {
      const qs = [...prev];
      qs[idx] = { ...qs[idx], [field]: value };
      return qs;
    });
  };

  const updateDraftOption = (qIdx: number, optIdx: number, value: string) => {
    setAiDrafts(prev => {
      const qs = [...prev];
      qs[qIdx].options[optIdx] = value;
      return qs;
    });
  };

  const handleCheckWithAi = async (idx: number, isDraft = false) => {
    const q = isDraft ? aiDrafts[idx] : questions[idx];
    if (!q.questionText || q.options.length < 2) return toast.error("Incomplete question");

    setCheckingAi(prev => ({ ...prev, [isDraft ? `draft_${idx}` : idx]: true }));
    try {
      const res = await checkQuestionWithAI(q.questionText, q.options, q.correctOptionIndex);
      setAiFeedback(prev => ({ ...prev, [isDraft ? `draft_${idx}` : idx]: res }));
    } catch (err: any) {
      toast.error(err.message || "AI check failed");
    } finally {
      setCheckingAi(prev => ({ ...prev, [isDraft ? `draft_${idx}` : idx]: false }));
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
    if (!selectedBankId || selectedQuestionIds.size === 0) return toast.error("Select at least one question");
    
    const bank = bankItems.find(b => b._id === selectedBankId);
    if (!bank) return;

    const selectedQuestions = bank.questions.filter((q: any) => selectedQuestionIds.has(q._id));
    
    const mapped = selectedQuestions.map((item: any) => ({
      bankQuestionId: item._id, // Add reference
      questionText: item.questionText,
      options: item.options,
      correctOptionIndex: item.correctOptionIndex,
      explanation: item.explanation || "",
      points: item.points || 1,
      authorDifficulty: item.authorDifficulty || difficulty,
      calibratedDifficulty: item.calibratedDifficulty,
      source: item.source || 'manual'
    }));

    setQuestions(prev => {
      const qs = [...prev];
      if (qs.length === 1 && qs[0].questionText === "" && qs[0].options[0] === "") {
        return mapped as any;
      }
      return [...qs, ...mapped] as any;
    });
    
    toast.success(`Added ${mapped.length} questions from bank`);
    setBankOpen(false);
    setSelectedBankId(null);
    setSelectedQuestionIds(new Set());
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
    } catch (err: any) {
      if (err.message?.includes('restricted') || err.message?.includes('banned')) {
        toast.error("You have been restricted from creating quizzes due to policy violations.", { duration: 5000 });
      } else {
        toast.error(err.message || "Failed to create quiz");
      }
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
                  <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCheckWithAi(qIdx, false)}
                      disabled={checkingAi[qIdx]}
                    >
                      {checkingAi[qIdx] ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Bot className="h-3 w-3 mr-2" />}
                      Check with AI
                    </Button>
                  </div>
                  {aiFeedback[qIdx] && (
                    <div className={`mt-2 p-3 text-sm rounded ${aiFeedback[qIdx].issuesFound ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-green-100 text-green-900 border border-green-200'}`}>
                      <strong>AI Review: </strong> {aiFeedback[qIdx].feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {aiDrafts.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h2 className="text-2xl font-bold text-purple-900">AI Generated Drafts ({aiDrafts.length})</h2>
                </div>
                {aiDrafts.map((q, qIdx) => (
                  <Card key={`draft-${qIdx}`} className="relative overflow-visible border-purple-200 bg-purple-50/30">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex gap-4 items-start">
                        <span className="font-bold text-xl mt-1 text-purple-400">D{qIdx + 1}.</span>
                        <div className="flex-1 space-y-4">
                          <Input 
                            value={q.questionText} 
                            onChange={e => updateDraft(qIdx, 'questionText', e.target.value)} 
                            placeholder="Type your question here..."
                            className="text-lg font-medium border-purple-200"
                          />
                          
                          <div className="space-y-3 pl-4 border-l-2 border-purple-300">
                            {q.options.map((opt: string, optIdx: number) => (
                              <div key={optIdx} className="flex gap-3 items-center">
                                <input 
                                  type="radio" 
                                  name={`draft-correct-${qIdx}`} 
                                  checked={q.correctOptionIndex === optIdx}
                                  onChange={() => updateDraft(qIdx, 'correctOptionIndex', optIdx)}
                                  className="h-5 w-5 text-purple-600 focus:ring-purple-600 border-purple-300"
                                />
                                <Input 
                                  value={opt} 
                                  onChange={e => updateDraftOption(qIdx, optIdx, e.target.value)} 
                                  placeholder={`Option ${optIdx + 1}`}
                                  className="border-purple-200"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-4 space-y-2">
                            <Label className="text-purple-700">Explanation</Label>
                            <Textarea 
                              value={q.explanation || ""} 
                              onChange={e => updateDraft(qIdx, 'explanation', e.target.value)} 
                              className="border-purple-200"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-purple-100">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCheckWithAi(qIdx, true)}
                          disabled={checkingAi[`draft_${qIdx}` as any]}
                          className="text-purple-700 border-purple-200 hover:bg-purple-100"
                        >
                          {checkingAi[`draft_${qIdx}` as any] ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Bot className="h-3 w-3 mr-2" />}
                          Re-Check with AI
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRejectDraft(qIdx)}>
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                          </Button>
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleApproveDraft(qIdx)}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                          </Button>
                        </div>
                      </div>

                      {aiFeedback[`draft_${qIdx}` as any] && (
                        <div className={`mt-2 p-3 text-sm rounded ${aiFeedback[`draft_${qIdx}` as any].issuesFound ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-green-100 text-green-900 border border-green-200'}`}>
                          <strong>AI Review: </strong> {aiFeedback[`draft_${qIdx}` as any].feedback}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

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
                    <DialogTitle>Personal Question Banks</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {loadingBank ? (
                      <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : bankItems.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Your question bank is empty.</p>
                    ) : !selectedBankId ? (
                      <div className="grid grid-cols-2 gap-3">
                        {bankItems.map(bank => (
                          <div 
                            key={bank._id} 
                            className="p-4 border rounded-md hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => setSelectedBankId(bank._id)}
                          >
                            <h3 className="font-semibold">{bank.title}</h3>
                            <p className="text-sm text-muted-foreground">{bank.questions?.length || 0} questions</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBankId(null)}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Banks
                        </Button>
                        <div className="space-y-3">
                          {bankItems.find(b => b._id === selectedBankId)?.questions?.map((q: any) => (
                            <div key={q._id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                              <input 
                                type="checkbox" 
                                className="mt-1 h-4 w-4"
                                checked={selectedQuestionIds.has(q._id)}
                                onChange={(e) => {
                                  const s = new Set(selectedQuestionIds);
                                  if (e.target.checked) s.add(q._id);
                                  else s.delete(q._id);
                                  setSelectedQuestionIds(s);
                                }}
                              />
                              <div>
                                <p className="font-medium text-sm">{q.questionText}</p>
                                <p className="text-xs text-muted-foreground capitalize">Difficulty: {q.authorDifficulty}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBankOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddFromBank} disabled={selectedQuestionIds.size === 0}>
                      Add Selected ({selectedQuestionIds.size})
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
              
                            <Button 
                variant="outline" 
                onClick={() => setAiOpen(true)}
                className="flex-1 py-8 border-dashed border-2 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-purple-700 border-purple-200"
              >
                <Sparkles className="h-5 w-5 mr-2" /> Generate with AI
              </Button>
              <AIGenerationModal 
                open={aiOpen}
                onOpenChange={setAiOpen}
                onGenerate={(questions) => {
                  setAiDrafts(prev => [...prev, ...questions]);
                  toast.success(`Generated ${questions.length} questions for review`);
                }}
              />
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
