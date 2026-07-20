import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Search, Tag as TagIcon, FileText, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Essay {
  _id: string;
  title: string;
  prompt?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const MyEssayBank = () => {
  const { user } = useAuth();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const fetchEssays = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/essay-bank`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEssays(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load essays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEssays();
  }, [user]);

  const handleOpenModal = (essay?: Essay) => {
    if (essay) {
      setEditingId(essay._id);
      setTitle(essay.title);
      setPrompt(essay.prompt || "");
      setContent(essay.content);
      setTagsInput(essay.tags?.join(", ") || "");
    } else {
      setEditingId(null);
      setTitle("");
      setPrompt("");
      setContent("");
      setTagsInput("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    const url = editingId 
        ? `${API_URL}/api/essay-bank/${editingId}`
        : `${API_URL}/api/essay-bank`;
    const method = editingId ? 'PATCH' : 'POST';
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, prompt, content, tags })
      });
      
      if (res.ok) {
        toast.success(editingId ? "Essay updated!" : "Essay saved to bank!");
        setIsModalOpen(false);
        fetchEssays();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save essay");
      }
    } catch (err) {
      toast.error("Failed to save essay");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this essay?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/essay-bank/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Essay deleted");
        fetchEssays();
      } else {
        toast.error("Failed to delete essay");
      }
    } catch (err) {
      toast.error("Failed to delete essay");
    }
  };

  const filteredEssays = essays.filter(e => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || 
           e.content.toLowerCase().includes(q) ||
           e.tags.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Essay Bank</h1>
            <p className="text-muted-foreground mt-1">Manage and adapt your scholarship essays</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search essays or tags..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenModal()} className="whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-2" />
                  New Essay
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Essay' : 'Add to Essay Bank'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Personal Statement v1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prompt (Optional)</Label>
                    <Textarea 
                      value={prompt} 
                      onChange={e => setPrompt(e.target.value)} 
                      placeholder="What was the prompt for this essay?" 
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <PublicTemplatesReference promptType={"general"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Essay Content</Label>
                    <Textarea 
                      required 
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                      placeholder="Your essay..." 
                      className="min-h-[250px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="leadership, community, stem" />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingId ? 'Save Changes' : 'Save Essay'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEssays.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">No essays found</CardTitle>
            <CardDescription className="mb-6">
              {search ? "No essays match your search." : "Start building your essay bank to apply faster."}
            </CardDescription>
            {!search && (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Essay
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEssays.map(essay => (
              <Card key={essay._id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl line-clamp-2">{essay.title}</CardTitle>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(essay)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(essay._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {essay.tags && essay.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {essay.tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs px-2 py-0">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  {essay.prompt && (
                    <div className="mb-3 text-sm border-l-2 border-primary/50 pl-3 italic text-muted-foreground line-clamp-2">
                      {essay.prompt}
                    </div>
                  )}
                  <p className="text-sm text-foreground/80 line-clamp-4 whitespace-pre-wrap">
                    {essay.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-3 border-t text-xs text-muted-foreground justify-between">
                  <span>{essay.content.split(/\s+/).length} words</span>
                  <span>Updated {format(new Date(essay.updatedAt || essay.createdAt), 'MMM d, yyyy')}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyEssayBank;

