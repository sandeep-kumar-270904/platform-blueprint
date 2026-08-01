import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  contextData?: any; // e.g. the specific chat message
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  contextData
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    
    setSubmitting(true);
    try {
      // 1. Submit Report
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/report`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          targetUserId,
          reason,
          notes,
          contextData
        })
      });

      if (!res.ok) throw new Error('Failed to submit report');

      // 2. Conditionally Block
      if (alsoBlock) {
        const blockRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/block`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ targetUserId })
        });
        if (!blockRes.ok) throw new Error('Failed to block user');
      }

      toast({
        title: "Report Submitted",
        description: alsoBlock 
          ? `${targetUserName} has been reported and blocked.` 
          : `Thank you for keeping the community safe. We will review ${targetUserName}'s profile.`,
      });
      
      onOpenChange(false);
      
      // Reset form
      setReason('');
      setNotes('');
      setAlsoBlock(false);
      
      // Optional: if we blocked them, we might want to refresh the page/state
      if (alsoBlock) {
        window.location.reload();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report {targetUserName}</DialogTitle>
            <DialogDescription>
              Your report is completely anonymous. They will not be notified that you reported them.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Why are you reporting this user?</label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate_content">Inappropriate Content / Photos</SelectItem>
                  <SelectItem value="harassment">Harassment or Hate Speech</SelectItem>
                  <SelectItem value="fake_profile">Fake Profile or Spam</SelectItem>
                  <SelectItem value="scam">Scam or Fraud</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Details (Optional)</label>
              <Textarea 
                placeholder="Please provide any extra context that will help us review this report..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-24 resize-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t mt-2">
              <Checkbox 
                id="alsoBlock" 
                checked={alsoBlock} 
                onCheckedChange={(c) => setAlsoBlock(c as boolean)} 
              />
              <label htmlFor="alsoBlock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Also block {targetUserName}
              </label>
            </div>
            {alsoBlock && (
              <p className="text-xs text-muted-foreground ml-6">
                Blocking them will remove your connection, archive your chat, and hide your profile from them entirely.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!reason || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
