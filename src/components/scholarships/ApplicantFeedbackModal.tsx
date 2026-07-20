import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApplicantFeedbackModalProps {
  appId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApplicantFeedbackModal: React.FC<ApplicantFeedbackModalProps> = ({ appId, isOpen, onOpenChange }) => {
  const [wasClear, setWasClear] = useState<string | null>(null);
  const [requirementsAccurate, setRequirementsAccurate] = useState<string | null>(null);
  const [confusingSteps, setConfusingSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!wasClear || !requirementsAccurate) {
      toast.error("Please answer the required questions.");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/scholarships/applications/${appId}/provider-feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wasClear: wasClear === 'yes',
          requirementsAccurate: requirementsAccurate === 'yes',
          confusingSteps: confusingSteps.trim() || undefined
        })
      });
      
      if (res.ok) {
        toast.success("Feedback submitted successfully. Thank you!");
        onOpenChange(false);
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Application Feedback
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <p className="text-sm text-muted-foreground">
            Help the scholarship provider improve their process. This is private and optional.
          </p>

          <div className="space-y-3">
            <Label>Was the application process clear?</Label>
            <RadioGroup value={wasClear || ''} onValueChange={setWasClear} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="clear-yes" />
                <Label htmlFor="clear-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="clear-no" />
                <Label htmlFor="clear-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <Label>Were the requirements accurate?</Label>
            <RadioGroup value={requirementsAccurate || ''} onValueChange={setRequirementsAccurate} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="req-yes" />
                <Label htmlFor="req-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="req-no" />
                <Label htmlFor="req-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Any confusing steps? (Optional)</Label>
            <Textarea 
              placeholder="E.g., Document uploads were unclear..." 
              value={confusingSteps}
              onChange={e => setConfusingSteps(e.target.value)}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
