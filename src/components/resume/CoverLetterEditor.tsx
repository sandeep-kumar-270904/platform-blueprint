import { useState } from 'react';
import { useCoverLetterEditor, useCoverLetters, useResumes } from '@/hooks/useResume';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, Download, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CoverLetterPDF } from './CoverLetterPDF';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  letterId: string;
  onBack: () => void;
}

export const CoverLetterEditor = ({ letterId, onBack }: Props) => {
  const { coverLetter, loading, updateCoverLetter } = useCoverLetterEditor(letterId);
  const { resumes } = useResumes();
  const { generateCoverLetter } = useCoverLetters();
  const { user } = useAuth();
  
  const [generating, setGenerating] = useState(false);
  
  if (loading || !coverLetter) return <div>Loading...</div>;

  const handleGenerate = async () => {
    if (!coverLetter.resumeId) {
      toast.error("Please select a resume to base the cover letter on.");
      return;
    }
    setGenerating(true);
    try {
      const generated = await generateCoverLetter(
        coverLetter.resumeId,
        coverLetter.jobDescription || '',
        coverLetter.tone || 'formal'
      );
      updateCoverLetter({ content: generated.content });
      toast.success("Cover letter generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input 
          value={coverLetter.title}
          onChange={e => updateCoverLetter({ title: e.target.value })}
          className="text-2xl font-bold border-none focus-visible:ring-0 px-0 h-auto"
        />
        <div className="ml-auto flex gap-2">
          <PDFDownloadLink
            document={<CoverLetterPDF letter={coverLetter} userName={user?.full_name} userEmail={user?.email} />}
            fileName={`${coverLetter.title.replace(/\s+/g, '_')}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" disabled={loading || !coverLetter.content}>
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Preparing...' : 'Export PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <div className="space-y-6 bg-slate-50 p-6 rounded-lg border">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Generator
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source Resume</Label>
              <Select 
                value={coverLetter.resumeId || ''} 
                onValueChange={val => updateCoverLetter({ resumeId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map(r => (
                    <SelectItem key={r._id} value={r._id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input 
                placeholder="e.g. Frontend Developer" 
                value={coverLetter.jobTitle || ''}
                onChange={e => updateCoverLetter({ jobTitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                placeholder="e.g. Acme Corp" 
                value={coverLetter.companyName || ''}
                onChange={e => updateCoverLetter({ companyName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select 
                value={coverLetter.tone || 'formal'} 
                onValueChange={val => updateCoverLetter({ tone: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal & Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Job Description (Optional)</Label>
              <Textarea 
                placeholder="Paste the job description here..."
                className="h-32 text-sm"
                value={coverLetter.jobDescription || ''}
                onChange={e => updateCoverLetter({ jobDescription: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating..." : "Generate Draft"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg">Cover Letter Content</Label>
          <Textarea 
            className="min-h-[600px] text-base p-6 leading-relaxed font-serif"
            placeholder="Your cover letter content..."
            value={coverLetter.content}
            onChange={e => updateCoverLetter({ content: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
