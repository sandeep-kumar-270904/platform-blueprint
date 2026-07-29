import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Languages, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';

interface TranslationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({ open, onOpenChange, resumeId }) => {
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('');
  const navigate = useNavigate();

  const handleTranslate = async () => {
    if (!language) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetLanguage: language })
      });
      if (res.ok) {
        const newResume = await res.json();
        onOpenChange(false);
        navigate(`/resume/builder/${newResume._id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Translate Resume
          </DialogTitle>
          <DialogDescription>
            Use AI to generate a translated draft of your resume. This will create a new resume document that you can manually review and edit before exporting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4 pb-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select target language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Mandarin">Mandarin (Simplified)</SelectItem>
              <SelectItem value="Japanese">Japanese</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleTranslate} disabled={!language || loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Translating...</> : <><ArrowRight className="h-4 w-4 mr-2" /> Create Draft</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
