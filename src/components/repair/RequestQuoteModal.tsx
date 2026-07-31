import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, ImagePlus, X, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  onSuccess: () => void;
}

const BUDGET_RANGES = [
  { value: "$0 - $50", label: "Small Fix ($0 - $50)" },
  { value: "$50 - $150", label: "Standard Repair ($50 - $150)" },
  { value: "$150 - $300", label: "Major Repair ($150 - $300)" },
  { value: "$300+", label: "Complex/Large ($300+)" },
  { value: "Not sure", label: "Not sure - Need estimate" },
];

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "handyman", label: "Handyman" },
  { value: "cleaning", label: "Cleaning" },
];

export function RequestQuoteModal({ isOpen, onClose, defaultCategory = "all", onSuccess }: RequestQuoteModalProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(defaultCategory !== "all" ? defaultCategory : "handyman");
  const [issue, setIssue] = useState("");
  const [budgetRange, setBudgetRange] = useState("Not sure");
  const [isUrgent, setIsUrgent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error("Please sign in to request quotes");

      const formData = new FormData();
      formData.append('category', category);
      formData.append('issueDescription', issue);
      formData.append('budgetRange', budgetRange);
      formData.append('isUrgent', isUrgent.toString());
      if (photo) formData.append('photo', photo);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/repair/quotes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit quote request');

      setStep(2);
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setIssue("");
    setIsUrgent(false);
    clearPhoto();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 1 ? "Get Multiple Quotes" : "Quote Request Sent"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Describe your issue and we'll notify matching providers. You'll start receiving quotes shortly." 
              : "Your request has been broadcasted to local pros."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label>Service Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue">Describe the issue</Label>
              <Textarea 
                id="issue"
                placeholder="E.g. My sink is leaking from the U-pipe underneath. Need it fixed soon." 
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                required
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Budget (Optional)</Label>
              <Select value={budgetRange} onValueChange={setBudgetRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a budget range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Add a photo (Optional)</Label>
              {photoPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border inline-block">
                  <img src={photoPreview} alt="Preview" className="h-24 w-auto object-cover" />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={clearPhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-muted-foreground/30 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                      <ImagePlus className="w-6 h-6 mb-2" />
                      <p className="text-xs">Click to upload image</p>
                    </div>
                    <Input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </div>
              )}
            </div>

            <div className={cn("flex items-start space-x-3 p-3 rounded-lg border", isUrgent ? "bg-red-500/10 border-red-500/30" : "bg-muted/30 border-transparent")}>
              <input 
                type="checkbox" 
                id="urgent-quote" 
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-red-500/50 text-red-500 focus:ring-red-500 bg-transparent" 
              />
              <div>
                <Label htmlFor="urgent-quote" className={cn("font-medium flex items-center gap-1", isUrgent ? "text-red-500" : "")}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Emergency / Urgent Request
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Alerts providers that you need immediate assistance.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!issue.trim() || submitting} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Broadcast Request
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Request Broadcasted!</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
              Local professionals have been notified. You'll start receiving quotes shortly — most requests get responses within a few hours.
            </p>
            <Button onClick={resetAndClose} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
