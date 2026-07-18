import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FRONTEND_URL = window.location.origin;

interface ResumeSharingProps {
  resumeId: string;
  initialSharing: {
    enabled: boolean;
    linkId?: string;
  };
  onUpdate: (updates: any) => void;
}

export const ResumeSharing = ({ resumeId, initialSharing, onUpdate }: ResumeSharingProps) => {
  const [enabled, setEnabled] = useState(initialSharing?.enabled || false);
  const [linkId, setLinkId] = useState(initialSharing?.linkId || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setLinkId(data.sharing.linkId);
      onUpdate({ sharing: data.sharing });
      toast.success(checked ? 'Sharing enabled' : 'Sharing disabled');
    } catch (err: any) {
      setEnabled(!checked);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `${FRONTEND_URL}/resume/shared/${linkId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card mt-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share Resume
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow anyone with the link to view your resume
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
      </div>

      {enabled && linkId && (
        <div className="pt-4 border-t space-y-3">
          <Label>Public Link</Label>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} className="bg-muted text-xs font-mono" />
            <Button size="icon" variant="outline" onClick={copyToClipboard} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <strong>Note:</strong> Anyone with this link can view a read-only version of your resume.
          </div>
        </div>
      )}
    </div>
  );
};
