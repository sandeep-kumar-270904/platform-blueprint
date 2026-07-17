import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Search as SearchIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New item state
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [expl, setExpl] = useState("");
  const [points, setPoints] = useState(1);
  const [newCat, setNewCat] = useState("General");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (category !== "all") query.append("category", category);

      const res = await fetch(`${API_URL}/api/question-bank/me?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (err) {
      toast.error("Failed to fetch question bank");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, category]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/question-bank/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success("Item deleted");
        setItems(items.filter(i => i._id !== id));
      } else {
        toast.error("Failed to delete item");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleSaveNew = async () => {
    if (!qText.trim()) return toast.error("Question text required");
    for (const opt of options) if (!opt.trim()) return toast.error("All options must be filled");
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/question-bank`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionText: qText,
          options,
          correctOptionIndex: correctIdx,
          explanation: expl,
          points,
          category: newCat
        })
      });

      if (res.ok) {
        toast.success("Question added to bank");
        setCreateMode(false);
        setQText("");
        setOptions(["", ""]);
        setCorrectIdx(0);
        setExpl("");
        fetchItems();
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
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold">Personal Question Bank</h1>
            <p className="text-muted-foreground mt-1">Manage reusable questions for your quizzes.</p>
          </div>
          <Button onClick={() => setCreateMode(!createMode)}>
            <Plus className="h-4 w-4 mr-2" /> 
            {createMode ? "Cancel" : "Add New Question"}
          </Button>
        </div>

        {createMode && (
          <Card className="mb-8 border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>New Bank Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Question text..." value={qText} onChange={e => setQText(e.target.value)} />
              
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input 
                      type="radio" 
                      name="correct-opt"
                      checked={correctIdx === idx}
                      onChange={() => setCorrectIdx(idx)}
                      className="h-4 w-4"
                    />
                    <Input value={opt} onChange={e => {
                      const newOpts = [...options];
                      newOpts[idx] = e.target.value;
                      setOptions(newOpts);
                    }} placeholder={`Option ${idx+1}`} />
                    {options.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => {
                        setOptions(options.filter((_, i) => i !== idx));
                        if (correctIdx >= options.length - 1) setCorrectIdx(0);
                      }}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}>
                    Add Option
                  </Button>
                )}
              </div>
              
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
                  <label className="text-sm font-medium">Points</label>
                  <Input type="number" min={1} value={points} onChange={e => setPoints(parseInt(e.target.value)||1)} />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveNew} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save to Bank
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search your bank..." value={search} onChange={e => setSearch(e.target.value)} />
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
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No questions found in your bank.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item._id} className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg pr-8">{item.questionText}</CardTitle>
                  <CardDescription>
                    {item.category} • {item.points} points • Used {item.usageCount} times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {item.options.map((opt: string, i: number) => (
                      <li key={i} className={`text-sm ${item.correctOptionIndex === i ? 'text-green-600 font-semibold flex items-center gap-2' : 'text-muted-foreground'}`}>
                        {item.correctOptionIndex === i && <span>✓</span>} {opt}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;
