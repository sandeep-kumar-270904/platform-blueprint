import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Upload, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ServiceListing } from "@/types/repair";
import { toast } from "@/components/ui/use-toast";
import { generateICS, downloadICS } from "@/utils/calendarUtils";

interface RequestServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ServiceListing;
  onSuccess: () => void;
}

const COMMON_ISSUES: Record<string, string[]> = {
  electronics: ["AC not cooling", "TV no picture", "Washing machine won't drain", "Refrigerator not cooling"],
  plumbing: ["Leaking pipe", "Clogged drain", "No hot water", "Toilet running"],
  electrical: ["Flickering lights", "Tripped breaker", "Outlets not working", "Short circuit"],
  cleaning: ["Deep clean", "Move in/out", "Sofa cleaning", "Pest control"],
  handyman: ["Furniture assembly", "Painting", "Wall repair", "Mounting TV"]
};

export const RequestServiceModal = ({ open, onOpenChange, provider, onSuccess }: RequestServiceModalProps) => {
  const [step, setStep] = useState(1);
  const [issue, setIssue] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [isAsap, setIsAsap] = useState(false);
  const [phone, setPhone] = useState("123-456-7890"); // Mock prefill
  const [submitting, setSubmitting] = useState(false);

  const commonIssues = COMMON_ISSUES[provider.category] || COMMON_ISSUES.handyman;
  const isClosed = provider.availability === 'Closed' || provider.availability?.includes("Closed");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(prev => prev + 1);
      return;
    }
    if (step === 4) {
      handleClose();
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Error', description: 'Please login to book a service', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const formData = new FormData();
      formData.append('providerId', provider.id);
      formData.append('issueDescription', issue);
      if (date) formData.append('preferredDate', date.toISOString());
      formData.append('preferredTime', time);
      formData.append('isAsap', isAsap.toString());
      formData.append('contactPhone', phone);
      
      const res = await fetch(`${API_URL}/api/repair/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      onSuccess();
      setStep(4); // Show success screen instead of closing immediately
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setIssue("");
      setDate(undefined);
      setIsAsap(false);
    }, 300);
  };

  const handleCalendarSync = () => {
    if (!date) return;
    
    // Create start time string combining date and time
    const dateStr = format(date, 'yyyy-MM-dd');
    const startTimeStr = `${dateStr}T${time || '10:00'}:00`;
    
    const ics = generateICS(
      `Repair Service: ${provider.name}`,
      `Service requested for: ${issue}\n\nCategory: ${provider.category}`,
      startTimeStr,
      60, // Assume 1 hour
      window.location.href
    );
    downloadICS(`repair-${provider.name}`, ics);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Service from {provider.name}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Tell us what you need help with."}
            {step === 2 && "When do you need this done?"}
            {step === 3 && "Confirm your details."}
            {step === 4 && "Your request has been sent."}
          </DialogDescription>
        </DialogHeader>

        {isClosed && step === 1 && (
          <div className="bg-warning/10 text-warning p-3 rounded-md flex items-start gap-2 text-sm mt-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>This provider is currently closed. They may not respond until their next business day.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>What's the issue?</Label>
                <Textarea 
                  placeholder="Describe what needs to be repaired..." 
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick Select</Label>
                <div className="flex flex-wrap gap-2">
                  {commonIssues.map((ci) => (
                    <Badge 
                      key={ci} 
                      variant={issue.includes(ci) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setIssue(prev => prev ? `${prev}, ${ci}` : ci)}
                    >
                      {ci}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="text-sm">Click to upload or drag and drop</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center space-x-2 bg-secondary/30 p-4 rounded-lg">
                <input 
                  type="checkbox" 
                  id="asap" 
                  checked={isAsap}
                  onChange={(e) => setIsAsap(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                />
                <Label htmlFor="asap" className="font-medium">As soon as possible</Label>
              </div>

              <div className={cn("space-y-4 transition-opacity duration-200", isAsap ? "opacity-50 pointer-events-none" : "opacity-100")}>
                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    required={!isAsap}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">{provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timing:</span>
                  <span className="font-medium">{isAsap ? "ASAP" : `${date ? format(date, 'MMM d') : ''} at ${time}`}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
                <p className="text-xs text-muted-foreground">The provider will call this number to confirm the booking.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300 py-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Request Submitted Successfully</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {provider.name} has been notified and will contact you shortly to confirm the appointment.
              </p>
              
              {!isAsap && date && (
                <div className="pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={handleCalendarSync}
                  >
                    <CalendarIcon className="h-4 w-4" /> Add to Calendar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    We'll also send you an automatic reminder shortly before the scheduled time.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t">
            {step > 1 && step < 4 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(prev => prev - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <div /> // Spacer
            )}
            
            {step === 4 ? (
              <Button type="button" onClick={handleClose} className="w-full sm:w-auto">
                Done
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : step < 3 ? (
                  <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  "Submit Request"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
