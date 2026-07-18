import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Linkedin, Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LinkedInExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

export const LinkedInExportModal: React.FC<LinkedInExportModalProps> = ({ open, onOpenChange, resumeId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/linkedin-export`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setData(null);
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-blue-600" />
            Export to LinkedIn
          </DialogTitle>
          <DialogDescription>
            Generate LinkedIn-optimized copy for your profile. 
            <strong> Note: This is a manual copy-paste tool. We do not automatically post to your LinkedIn profile.</strong>
          </DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-muted-foreground">
              Our AI will reformat your resume's experience and generate an engaging, first-person "About" summary suited for LinkedIn.
            </p>
            <Button onClick={handleGenerate} disabled={loading} size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : 'Generate LinkedIn Copy'}
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-1">
            <div className="space-y-6 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">About / Summary</h3>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(data.summary, 'summary')}>
                    {copiedSection === 'summary' ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                </div>
                <div className="p-4 bg-muted/30 border rounded-md whitespace-pre-wrap text-sm">
                  {data.summary}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Experience</h3>
                {data.experiences && data.experiences.map((exp: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{exp.title} @ {exp.company}</h4>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(exp.description, `exp-${i}`)}>
                        {copiedSection === `exp-${i}` ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy Description
                      </Button>
                    </div>
                    <div className="p-4 bg-muted/30 border rounded-md whitespace-pre-wrap text-sm">
                      {exp.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
