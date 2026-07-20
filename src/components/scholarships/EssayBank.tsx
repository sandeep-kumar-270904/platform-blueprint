import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Edit, Trash2, Library, Wand2 } from "lucide-react";
import { useEssays } from "@/hooks/useEssays";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const EssayBank = ({ 
    onSelectEssay, 
    currentPrompt,
    targetScholarshipId,
    targetPromptFieldKey
}: { 
    onSelectEssay?: (content: string) => void,
    currentPrompt?: string,
    targetScholarshipId?: string,
    targetPromptFieldKey?: string
}) => {
    const { essays, loading, addEssay, updateEssay, deleteEssay, adaptEssay } = useEssays();
    const [isOpen, setIsOpen] = useState(false);
    
    // View state
    const [view, setView] = useState<'list' | 'edit' | 'adapt'>('list');
    const [selectedEssay, setSelectedEssay] = useState<any>(null);
    
    // Edit state
    const [title, setTitle] = useState("");
    const [promptText, setPromptText] = useState("");
    const [content, setContent] = useState("");
    
    // Adapt state
    const [adapting, setAdapting] = useState(false);
    const [adaptedContent, setAdaptedContent] = useState("");

    const handleOpenNew = () => {
        setSelectedEssay(null);
        setTitle("");
        setPromptText("");
        setContent("");
        setView('edit');
    };

    const handleOpenEdit = (essay: any) => {
        setSelectedEssay(essay);
        setTitle(essay.title);
        setPromptText(essay.prompt);
        setContent(essay.content);
        setView('edit');
    };

    const handleSave = async () => {
        const payload = { title, prompt: promptText, content };
        if (selectedEssay) {
            await updateEssay(selectedEssay._id, payload);
        } else {
            await addEssay(payload);
        }
        setView('list');
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this essay?")) {
            await deleteEssay(id);
        }
    };

    const handleAdapt = async (essay: any) => {
        if (!targetScholarshipId || !targetPromptFieldKey) {
            toast.error("Cannot adapt without scholarship context.");
            return;
        }
        setSelectedEssay(essay);
        setView('adapt');
        setAdapting(true);
        const result = await adaptEssay(essay._id, targetScholarshipId, targetPromptFieldKey);
        setAdaptedContent(result || "Failed to adapt. Please try again.");
        setAdapting(false);
    };

    const handleUse = (text: string) => {
        if (onSelectEssay) {
            onSelectEssay(text);
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => {
            setIsOpen(open);
            if (open) setView('list');
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Library className="h-4 w-4" />
                    Essay Bank
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {view === 'list' && "Your Essay Bank"}
                        {view === 'edit' && (selectedEssay ? "Edit Essay" : "New Essay")}
                        {view === 'adapt' && "AI Adaptation"}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                    </div>
                ) : view === 'list' ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex justify-end mb-4">
                            <Button size="sm" onClick={handleOpenNew} className="gap-2">
                                <Plus className="h-4 w-4" /> Add Essay
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 -mx-4 px-4">
                            <div className="space-y-4">
                                {essays.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                                        <Library className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No essays saved yet.</p>
                                        <p className="text-sm">Save your best essays to reuse them across applications.</p>
                                    </div>
                                ) : (
                                    essays.map(essay => (
                                        <Card key={essay._id} className="hover:border-primary/50 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold">{essay.title}</h3>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{essay.prompt}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(essay)}>
                                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => handleDelete(e, essay._id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                    {essay.content}
                                                </p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-xs text-muted-foreground">Used {essay.timesUsed} times</span>
                                                        <div className="flex flex-wrap gap-2 justify-end">
                                                            <Button size="sm" variant="outline" onClick={async () => {
                                                                try {
                                                                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/scholarships/templates/generate`, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                                                            'Content-Type': 'application/json'
                                                                        },
                                                                        body: JSON.stringify({ essayContent: essay.content, promptType: essay.prompt })
                                                                    });
                                                                    if (res.ok) {
                                                                        const data = await res.json();
                                                                        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/scholarships/templates`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                                                                'Content-Type': 'application/json'
                                                                            },
                                                                            body: JSON.stringify({ originalEssayId: essay._id, promptType: essay.prompt, structureSummary: data.structureSummary })
                                                                        });
                                                                        alert("Template successfully generated and shared to community!");
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }} className="gap-2">
                                                                <Library className="h-3 w-3" /> Share Template
                                                            </Button>
                                                            {currentPrompt && onSelectEssay && (
                                                                <Button size="sm" variant="secondary" onClick={() => handleAdapt(essay)} className="gap-2">
                                                                    <Wand2 className="h-3 w-3" /> Adapt AI
                                                                </Button>
                                                            )}
                                                            {onSelectEssay && (
                                                                <Button size="sm" onClick={() => handleUse(essay.content)}>
                                                                    Use As Is
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                    </div>
                ) : view === 'edit' ? (
                    <div className="space-y-4 py-4 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Personal Statement - Leadership" />
                        </div>
                        <div className="space-y-2">
                            <Label>Original Prompt</Label>
                            <Input value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="What was this essay written for?" />
                        </div>
                        <div className="space-y-2">
                            <Label>Essay Content</Label>
                            <Textarea 
                                value={content} 
                                onChange={e => setContent(e.target.value)} 
                                className="min-h-[250px]"
                                placeholder="Paste your essay here..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!title || !content}>Save Essay</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4 flex-1 flex flex-col min-h-0">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-sm space-y-2">
                            <div className="font-semibold flex items-center gap-2 text-primary">
                                <Wand2 className="h-4 w-4" /> AI Adaptation
                            </div>
                            <p><strong>Original Prompt:</strong> {selectedEssay.prompt}</p>
                            <p><strong>New Prompt:</strong> {currentPrompt}</p>
                        </div>
                        
                        <div className="flex-1 space-y-2 mt-4 min-h-0 flex flex-col">
                            <Label>Adapted Draft</Label>
                            {adapting ? (
                                <div className="flex-1 border rounded-md flex flex-col items-center justify-center min-h-[200px] text-muted-foreground gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p>Adapting your essay using Gemini...</p>
                                </div>
                            ) : (
                                <Textarea 
                                    value={adaptedContent} 
                                    onChange={e => setAdaptedContent(e.target.value)} 
                                    className="flex-1 min-h-[200px] resize-none"
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setView('list')}>Back</Button>
                            {onSelectEssay && !adapting && (
                                <Button onClick={() => handleUse(adaptedContent)}>Use This Draft</Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
