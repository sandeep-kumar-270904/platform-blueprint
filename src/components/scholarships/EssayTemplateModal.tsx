import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EssayTemplateModalProps {
  storyId: string;
}

export const EssayTemplateModal: React.FC<EssayTemplateModalProps> = ({ storyId }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedEssayId, setSelectedEssayId] = useState('');
  const [templateDraft, setTemplateDraft] = useState<any>(null);
  
  const [structuralSummary, setStructuralSummary] = useState('');
  const [fullTextShared, setFullTextShared] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedEssayId('');
      setTemplateDraft(null);
      fetchEssays();
    }
  }, [open]);

  const fetchEssays = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!selectedEssayId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/essay-bank/${selectedEssayId}/create-template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promptType: 'general' }) // Sending a default or letting backend decide
      });
      if (res.ok) {
        const data = await res.json();
        setTemplateDraft(data.template);
        setStructuralSummary(data.template.structuralSummary || '');
        setFullTextShared(false);
        setStep('review');
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to create template. Are you sure this essay was used in the awarded application?');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!templateDraft) return;
    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/essay-templates/${templateDraft._id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          structuralSummary,
          fullTextShared
        })
      });
      if (res.ok) {
        toast.success('Template published successfully!');
        setOpen(false);
      } else {
        toast.error('Failed to publish template');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 mt-4 text-primary border-primary/20 hover:bg-primary/10">
          <Share2 className="h-4 w-4" /> Share your essay structure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Application Template</DialogTitle>
        </DialogHeader>
        
        {step === 'select' && (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Select an essay from your Essay Bank that you used for this awarded application. We will use AI to extract the structural framework to help others, without sharing your personal details.
            </p>
            
            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {essays.length === 0 ? (
                  <p className="text-sm text-center py-4 text-muted-foreground">No essays found in your bank.</p>
                ) : (
                  essays.map(essay => (
                    <div 
                      key={essay._id} 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedEssayId === essay._id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedEssayId(essay._id)}
                    >
                      <h4 className="font-semibold text-sm truncate">{essay.title || 'Untitled Essay'}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{essay.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={handleCreateTemplate} disabled={!selectedEssayId || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Structure <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 pt-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm flex gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>Review the AI-generated summary below. This structure will be visible to other students looking for inspiration.</p>
            </div>
            
            <div className="grid gap-2">
              <Label>Structural Summary</Label>
              <Textarea 
                value={structuralSummary} 
                onChange={(e) => setStructuralSummary(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="space-y-0.5">
                <Label>Share full text anonymously?</Label>
                <p className="text-xs text-muted-foreground">Allow others to see the complete essay text</p>
              </div>
              <Switch 
                checked={fullTextShared}
                onCheckedChange={setFullTextShared}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setStep('select')} disabled={publishing}>Back</Button>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Template
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
