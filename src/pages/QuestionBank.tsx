import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Search as SearchIcon, ArrowLeft, Folder, Users, Globe, GitFork } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"my" | "public">("my");
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New bank state
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [newCat, setNewCat] = useState("General");

  // View Bank state
  const [selectedBank, setSelectedBank] = useState<any | null>(null);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (category !== "all") query.append("category", category);

      const endpoint = activeTab === "my" ? "/api/question-bank/me" : "/api/question-bank/public";
      const res = await fetch(`${API_URL}${endpoint}?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks);
      }
    } catch (err) {
      toast.error("Failed to fetch banks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [search, category, activeTab]);

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this bank?")) return;
    try {
      const res = await fetch(`${API_URL}/api/question-bank/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success("Bank deleted");
        setBanks(banks.filter(b => b._id !== id));
      } else {
        toast.error("Failed to delete bank");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleFork = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/question-bank/${id}/fork`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success("Bank forked successfully!");
        setActiveTab("my");
      } else {
        toast.error("Failed to fork bank");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleSaveNew = async () => {
    if (!title.trim()) return toast.error("Title required");
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/question-bank`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, category: newCat, visibility })
      });

      if (res.ok) {
        toast.success("Bank created");
        setCreateMode(false);
        setTitle("");
        fetchBanks();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/quizzes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quizzes
        </Button>
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Question Banks</h1>
            <p className="text-muted-foreground mt-1">Organize your questions into reusable collections.</p>
          </div>
          <Button onClick={() => setCreateMode(!createMode)}>
            <Plus className="h-4 w-4 mr-2" /> 
            {createMode ? "Cancel" : "New Bank"}
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <Button variant={activeTab === "my" ? "default" : "outline"} onClick={() => setActiveTab("my")}>
            <Folder className="h-4 w-4 mr-2" /> My Banks
          </Button>
          <Button variant={activeTab === "public" ? "default" : "outline"} onClick={() => setActiveTab("public")}>
            <Globe className="h-4 w-4 mr-2" /> Public Banks
          </Button>
        </div>

        {createMode && (
          <Card className="mb-8 border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>Create New Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Bank Title..." value={title} onChange={e => setTitle(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newCat} onValueChange={setNewCat}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {["General", "CS Fundamentals", "Mathematics", "Aptitude"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Visibility</label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveNew} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Bank
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search banks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="CS Fundamentals">CS Fundamentals</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Aptitude">Aptitude</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : banks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-lg shadow-sm border">
            No question banks found. {activeTab === "my" && "Create one above to get started!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <Card key={bank._id} className="relative hover:shadow-md transition-shadow">
                {activeTab === "my" && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive z-10"
                    onClick={() => handleDelete(bank._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div 
                  className="cursor-pointer" 
                  onClick={() => setSelectedBank(bank)}
                >
                  <CardHeader className="pb-2 pt-6">
                    <CardTitle className="text-lg pr-8">{bank.title}</CardTitle>
                    <CardDescription className="flex justify-between items-center mt-2">
                      <span>{bank.category}</span>
                      <span className="flex items-center bg-muted px-2 py-0.5 rounded text-xs">
                        {bank.visibility === 'public' ? <Globe className="h-3 w-3 mr-1" /> : <Folder className="h-3 w-3 mr-1" />}
                        {bank.visibility}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      {bank.questions?.length || 0} questions
                    </div>
                    {activeTab === "public" && bank.ownerId && (
                      <div className="flex items-center text-xs text-muted-foreground border-t pt-3">
                        <Users className="h-3 w-3 mr-1" /> 
                        By {bank.ownerId.full_name || bank.ownerId.username}
                      </div>
                    )}
                  </CardContent>
                </div>
                {activeTab === "public" && (
                  <div className="px-6 pb-4 pt-0">
                    <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleFork(bank._id); }}>
                      <GitFork className="h-3 w-3 mr-2" /> Fork to My Banks
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* View Bank Dialog */}
        <Dialog open={!!selectedBank} onOpenChange={(open) => !open && setSelectedBank(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center justify-between pr-8">
                <div className="flex items-center gap-3">
                  <span>{selectedBank?.title}</span>
                  <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    {selectedBank?.category}
                  </span>
                </div>
                {selectedBank?.questions?.length > 0 && (
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      try {
                        const { startAdaptivePractice } = await import('@/hooks/useQuizHub');
                        const res = await startAdaptivePractice(selectedBank._id);
                        navigate(`/attempts/${res.attempt._id}/take`);
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to start practice');
                      }
                    }}
                  >
                    Start Adaptive Practice
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
              {selectedBank?.questions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">This bank is empty.</div>
              ) : (
                selectedBank?.questions?.map((q: any, i: number) => (
                  <Card key={q._id || i} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <p className="font-medium mb-3">{i + 1}. {q.questionText}</p>
                      <div className="space-y-1">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className={`text-sm px-2 py-1 rounded ${q.correctOptionIndex === optIdx ? 'bg-green-100 text-green-800 font-medium' : ''}`}>
                            {q.correctOptionIndex === optIdx ? "✓ " : "• "}{opt}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground flex gap-3">
                        <span>Difficulty: <strong className="capitalize">{q.authorDifficulty}</strong></span>
                        {q.calibratedDifficulty && <span>Calibrated: <strong className="capitalize">{q.calibratedDifficulty}</strong></span>}
                        {q.source === 'ai_generated' && <span className="text-purple-600 bg-purple-100 px-1 rounded">AI Generated</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default QuestionBank;
