import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, Loader2, AlertTriangle, Check } from "lucide-react";

interface CreatorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onReasonChange: (val: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  targetTitle?: string;
  isComment?: boolean;
}

export const CreatorReportModal: React.FC<CreatorReportModalProps> = ({
  isOpen,
  onClose,
  reason,
  onReasonChange,
  onSubmit,
  isSubmitting,
  targetTitle,
  isComment = false
}) => {
  const reasons = [
    { id: "Spam", label: "Spam or Unsolicited Promotion", desc: "Commercial links, repetitive spam, or fake engagement." },
    { id: "Inappropriate", label: "Inappropriate Content or Harassment", desc: "Abusive language, bullying, or hate speech." },
    { id: "Plagiarism", label: "Plagiarism or Copyright Violation", desc: "Stolen code, uncredited tutorials, or copyrighted media." },
    { id: "Misleading", label: "Misleading or Scam", desc: "Deceptive career advice, scams, or malicious links." }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        aria-labelledby="report-modal-title"
        aria-describedby="report-modal-desc"
        className="max-w-md p-6 rounded-2xl shadow-xl bg-card border border-border/80"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle id="report-modal-title" className="text-xl font-bold flex items-center gap-2 text-destructive">
            <Flag className="h-5 w-5 shrink-0" />
            <span>Report {isComment ? "Comment" : "Content"}</span>
          </DialogTitle>
          {targetTitle && (
            <p className="text-xs text-muted-foreground font-medium truncate bg-muted/30 p-2 rounded-lg border border-border/40">
              Target: <span className="text-foreground font-semibold">"{targetTitle}"</span>
            </p>
          )}
        </DialogHeader>

        <div id="report-modal-desc" className="space-y-4 py-2">
          <p className="text-sm text-foreground/90 font-medium">
            Please select the primary reason for flagging this {isComment ? "comment" : "content piece"}. Our moderation team reviews all reports.
          </p>

          <div role="radiogroup" aria-label="Violation reason" className="space-y-2.5">
            {reasons.map((r) => (
              <button
                type="button"
                role="radio"
                aria-checked={reason === r.id}
                key={r.id}
                onClick={() => onReasonChange(r.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive ${
                  reason === r.id 
                    ? "border-destructive bg-destructive/10 text-destructive dark:text-red-400 font-bold shadow-sm" 
                    : "border-border/60 bg-card hover:bg-muted/40 text-foreground"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <span>{r.label}</span>
                  </div>
                  <div className={`text-xs mt-0.5 ${reason === r.id ? "text-destructive/80 dark:text-red-300" : "text-muted-foreground"}`}>
                    {r.desc}
                  </div>
                </div>
                {reason === r.id && (
                  <div className="w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <span>False or malicious reporting may lead to temporary suspension of reporting privileges.</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/40">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onSubmit} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto font-bold min-h-[44px] px-6 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
