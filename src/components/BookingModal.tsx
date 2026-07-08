import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/icsGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Video, Calendar, FileText, CheckCircle2, Copy, Download, Loader2 } from "lucide-react";
import type { MentorRow, AvailabilitySlot } from "@/hooks/useMentors";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: MentorRow | null;
  slot: AvailabilitySlot | null;
}

export const BookingModal = ({ open, onOpenChange, mentor, slot }: BookingModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<"payment" | "confirmed">("payment");
  const [cardNumber, setCardNumber] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to book a session", variant: "destructive" });
      return;
    }
    if (!mentor || !slot) return;
    if (cardNumber.length < 16) {
      toast({ title: "Invalid card", description: "Enter a valid 16-digit card number", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/mentors/bookings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slot.id, mentor_id: mentor.id, notes: sessionNotes })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Booking failed');
      }
      
      const newBooking = await res.json();
      setBookingId(newBooking._id || newBooking.id);
      setVideoLink(newBooking.video_link || "");
      setStep("confirmed");
      toast({ title: "Booking confirmed!", description: "Your mentor session is scheduled." });
    } catch (error: any) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoLink);
    toast({ title: "Copied", description: "Video link copied to clipboard" });
  };

  const handleDownloadCalendar = () => {
    if (!mentor || !slot) return;
    const start = new Date(slot.starts_at);
    const end = new Date(slot.ends_at);
    const ics = generateICS({
      title: `Mentorship with ${mentor.profile?.full_name || mentor.profile?.username || mentor.title}`,
      description: `${mentor.title}${mentor.company ? ` at ${mentor.company}` : ""}\n\n${sessionNotes || "1-on-1 mentorship session"}`,
      location: "Virtual",
      startTime: start,
      endTime: end,
      url: videoLink,
    });
    downloadICS(ics, `mentorship-${start.toISOString().slice(0, 10)}.ics`);
  };

  const handleClose = () => {
    setStep("payment");
    setCardNumber("");
    setSessionNotes("");
    setVideoLink("");
    setBookingId(null);
    onOpenChange(false);
  };

  if (!mentor || !slot) return null;
  const total = mentor.price_per_hour;
  const start = new Date(slot.starts_at);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{step === "payment" ? "Complete Booking" : "Booking Confirmed"}</DialogTitle>
        </DialogHeader>

        {step === "payment" ? (
          <div className="space-y-6 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Mentor</span><span className="font-medium">{mentor.profile?.full_name || mentor.profile?.username || "Mentor"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{start.toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">60 min</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>₹{total}</span></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2"><FileText className="h-4 w-4" />Session Notes (optional)</Label>
              <Textarea id="notes" placeholder="Topics or questions you'd like to discuss..." value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value.slice(0, 1000))} rows={3} />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" />Payment</Label>
              <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))} maxLength={16} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="MM/YY" maxLength={5} />
                <Input placeholder="CVV" type="password" maxLength={3} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Secure 256-bit encryption (demo)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3"><CheckCircle2 className="h-6 w-6 text-green-500" /></div>
              <h3 className="font-semibold mb-1">Booking confirmed!</h3>
              <p className="text-sm text-muted-foreground">Tracked in your dashboard.</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" />Video link</Label>
              <div className="flex gap-2"><Input value={videoLink} readOnly className="font-mono text-sm" /><Button variant="outline" size="icon" onClick={handleCopyLink}><Copy className="h-4 w-4" /></Button></div>
            </div>
            <Button onClick={handleDownloadCalendar} variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" />Add to Calendar</Button>
            <Badge variant="secondary" className="w-full justify-center py-2"><Calendar className="mr-2 h-3 w-3" />Your booking syncs live to the dashboard</Badge>
          </div>
        )}

        <DialogFooter>
          {step === "payment" ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handlePayment} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Pay ₹{total}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
