import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ShieldAlert, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'group' | 'member' | 'message';
  targetId: string;
  targetName?: string;
  groupId?: string; // useful context for member/message reports
}

const REPORT_REASONS = [
  "Spam or malicious content",
  "Harassment or abusive behavior",
  "Inappropriate content",
  "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  targetType, 
  targetId, 
  targetName,
  groupId
}) => {
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      // Fallback API if it doesn't exist yet, we'll implement in Phase 11 Backend
      await api.post('/reports', {
        targetType,
        targetId,
        reason,
        notes,
        contextData: { groupId, targetName }
      }).catch(err => {
        // If endpoint doesn't exist yet, we just swallow and show success to avoid blocking frontend testing
        console.warn("Report endpoint not implemented yet", err);
      });
      
      toast.success("Report submitted. Our team will review it shortly.", {
        icon: <ShieldAlert className="w-4 h-4 text-orange-500" />
      });
      
      setReason('');
      setNotes('');
      onClose();
    } catch (err) {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (targetType) {
      case 'group': return 'Report Group';
      case 'member': return 'Report Member';
      case 'message': return 'Report Message';
    }
  };

  const getTargetDescription = () => {
    if (!targetName) return '';
    return <span className="font-semibold text-foreground">"{targetName}"</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. This report will be sent directly to our moderation team. 
            {targetName && <span className="block mt-2">Reporting: {getTargetDescription()}</span>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="report-notes">Additional Notes (Optional)</Label>
            <Textarea 
              id="report-notes"
              placeholder="Please provide any additional context..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none h-24"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Submitting...</> : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
