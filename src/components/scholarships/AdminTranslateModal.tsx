import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Languages, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AdminTranslateModalProps {
  scholarshipId: string;
  originalTitle: string;
  originalDescription: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminTranslateModal: React.FC<AdminTranslateModalProps> = ({ scholarshipId, originalTitle, originalDescription, isOpen, onClose, onSuccess }) => {
  const [lang, setLang] = useState('es');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [source, setSource] = useState<'gemini-sourced' | 'manually-edited' | null>(null);

  const handleGenerate = async () => {
    setIsTranslating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetLanguage: lang })
      });
      const data = await res.json();
      if (res.ok) {
        setTitle(data.title);
        setDescription(data.description);
        setSource('gemini-sourced');
        toast.success(`Generated ${lang} translation using AI`);
      } else {
        toast.error('Failed to generate translation');
      }
    } catch (err) {
      toast.error('Error generating translation');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/translations/${lang}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description, source: source === 'gemini-sourced' ? 'gemini-sourced' : 'manually-edited' })
      });
      if (res.ok) {
        toast.success('Translation saved successfully');
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to save translation');
      }
    } catch (err) {
      toast.error('Error saving translation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Manage Translations
          </DialogTitle>
          <DialogDescription>
            Generate AI translations or manually edit them for {originalTitle}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Target Language</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español (Spanish)</SelectItem>
                  <SelectItem value="fr">Français (French)</SelectItem>
                  <SelectItem value="de">Deutsch (German)</SelectItem>
                  <SelectItem value="zh">中文 (Chinese)</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isTranslating} variant="secondary">
              {isTranslating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate AI Translation
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Translated Title</Label>
              <Input 
                value={title} 
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSource('manually-edited');
                }} 
                placeholder="Translated title will appear here..." 
              />
            </div>
            <div className="space-y-2">
              <Label>Translated Description</Label>
              <Textarea 
                value={description} 
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSource('manually-edited');
                }} 
                rows={6}
                placeholder="Translated description will appear here..." 
              />
            </div>
            
            {source && (
              <p className="text-xs text-muted-foreground italic">
                Current draft is: <span className="font-semibold">{source === 'gemini-sourced' ? 'AI Generated' : 'Manually Edited'}</span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !title || !description}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Translation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
