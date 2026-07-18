import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Video, Loader2, Star, MessageSquare, WifiOff } from "lucide-react";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { type AvailabilitySlot } from "@/hooks/useMentors";

export const MyMentorBookings = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reschedule state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reschedulingBooking, setReschedulingBooking] = useState<any>(null);
  const [nextSlots, setNextSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Dispute state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeBooking, setDisputeBooking] = useState<any>(null);
  const [disputeCategory, setDisputeCategory] = useState("no_show");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setBookings(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (user && token) {
      fetchBookings();
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      socket.on(`my_bookings_updated_${user.id}`, () => {
        fetchBookings();
      });
      return () => { 
        socket.disconnect(); 
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, token]);

  const submitReview = async () => {
    if (!reviewingBooking) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/bookings/${reviewingBooking._id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, writtenFeedback: feedback })
      });
      
      if (!res.ok) throw new Error((await res.json()).message);
      
      toast({ title: "Review submitted!" });
      setReviewModalOpen(false);
      setReviewingBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitDispute = async () => {
    if (!disputeBooking) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          bookingId: disputeBooking._id,
          category: disputeCategory,
          description: disputeDescription
        })
      });
      if (!res.ok) throw new Error((await res.json()).message);
      
      toast({ title: "Dispute submitted", description: "Our team will review your case shortly." });
      setDisputeModalOpen(false);
      setDisputeBooking(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleCancel = async (booking: any) => {
    const hoursUntilSession = (new Date(booking.slotId?.starts_at || booking.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
    const isPaid = booking.paymentStatus === 'paid';
    
    let confirmMessage = "Are you sure you want to cancel this booking?";
    if (isPaid) {
      if (hoursUntilSession > 24) {
        confirmMessage = "Are you sure? You will receive a full refund since you are cancelling more than 24 hours in advance.";
      } else {
        confirmMessage = "Are you sure? Because this session is within 24 hours, you WILL NOT receive a refund.";
      }
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/bookings/${booking._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "Mentee cancelled." })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      let msg = "Booking cancelled.";
      if (data.refundStatus === 'full') msg += " A full refund has been initiated.";
      toast({ title: "Cancelled", description: msg });
      
      fetchBookings();
    } catch (err: any) {
      if (!navigator.onLine) {
        toast({ title: "Offline", description: "Your cancellation has been queued and will process when you're back online.", variant: "default" });
        setBookings(prev => prev.map(b => b._id === booking._id ? { ...b, status: 'cancelled' } : b));
      } else {
        toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleOpenReschedule = async (booking: any) => {
    setReschedulingBooking(booking);
    setRescheduleModalOpen(true);
    setLoadingSlots(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/${booking.mentorId._id}/availability`);
      if (res.ok) {
        const slots = await res.json();
        // Get next 3 available slots
        const available = slots.filter((s: AvailabilitySlot) => !s.is_booked);
        setNextSlots(available.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async (slotId: string) => {
    if (!reschedulingBooking) return;
    setSubmittingReschedule(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/bookings/${reschedulingBooking._id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newDate: slotId, reason: "Mentee rescheduled via dashboard." })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast({ title: "Rescheduled", description: "Your session has been successfully rescheduled." });
      setRescheduleModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      if (!navigator.onLine) {
        toast({ title: "Offline", description: "Your reschedule request has been queued.", variant: "default" });
        setRescheduleModalOpen(false);
      } else {
        toast({ title: "Reschedule failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const isPast = (date: string) => new Date(date) < new Date();

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Mentorship Sessions</h2>
          <p className="text-muted-foreground">View and manage your upcoming and past bookings.</p>
        </div>
      </div>
      
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>You are currently offline. Viewing cached upcoming bookings. Actions will be synced later.</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
            <p className="text-muted-foreground max-w-sm">You haven't booked any mentorship sessions. Explore mentors to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map(booking => {
            const start = new Date(booking.slotId?.starts_at);
            const past = isPast(booking.slotId?.starts_at);
            
            return (
              <Card key={booking._id} className={past ? 'opacity-80' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarImage src={booking.mentorId?.user_id?.avatar_url} />
                        <AvatarFallback>{booking.mentorId?.user_id?.full_name?.charAt(0) || "M"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{booking.mentorId?.user_id?.full_name || "Mentor"}</div>
                        <div className="text-sm text-muted-foreground">{booking.mentorId?.title}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {booking.paymentStatus === 'paid' && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Paid</Badge>}
                      {booking.paymentStatus === 'pending' && <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Payment Pending</Badge>}
                      <Badge variant={booking.status === 'confirmed' ? 'default' : (['completed', 'cancelled'].includes(booking.status) ? 'secondary' : (booking.status === 'no-show' ? 'destructive' : 'outline'))}>
                        {booking.status === 'no-show' ? 'No Show' : booking.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {start.toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  
                  {booking.meetingLink && !past && booking.status === 'confirmed' && (
                    <Button className="w-full gap-2" variant="outline" asChild>
                      <a href={booking.meetingLink} target="_blank" rel="noreferrer"><Video className="h-4 w-4" /> Join Video Call</a>
                    </Button>
                  )}

                  {booking.status === 'no-show' && (
                    <div className="text-sm p-3 bg-red-50 text-red-800 rounded-lg border border-red-100">
                      {booking.noShowBy === 'mentor' && "Your mentor missed this session. You have been fully refunded automatically."}
                      {booking.noShowBy === 'mentee' && "You missed this session. Per our policy, your payment/reschedule right is forfeited."}
                      {booking.noShowBy === 'both' && "Neither you nor the mentor joined this session. You have been refunded."}
                    </div>
                  )}

                  {!past && !['completed', 'cancelled', 'no-show'].includes(booking.status) && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" className="w-full" onClick={() => handleOpenReschedule(booking)}>Reschedule</Button>
                      <Button variant="destructive" className="w-full" onClick={() => handleCancel(booking)}>Cancel</Button>
                    </div>
                  )}

                  {past && booking.status === 'completed' && (
                    <Button 
                      className="w-full gap-2" 
                      variant="secondary"
                      onClick={() => { setReviewingBooking(booking); setRating(5); setFeedback(""); setReviewModalOpen(true); }}
                    >
                      <Star className="h-4 w-4" /> Leave a Review
                    </Button>
                  )}
                  {past && ['completed', 'cancelled', 'no-show'].includes(booking.status) && (
                    <Button 
                      className="w-full gap-2 mt-2" 
                      variant="ghost"
                      onClick={() => { setDisputeBooking(booking); setDisputeCategory("no_show"); setDisputeDescription(""); setDisputeModalOpen(true); }}
                    >
                      Report an Issue
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(r => (
                <button key={r} type="button" onClick={() => setRating(r)} className="p-1 focus:outline-none hover:scale-110 transition-transform">
                  <Star className={`h-8 w-8 ${r <= rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Written Feedback (Public)</Label>
              <Textarea 
                placeholder="How was the session? Did the mentor help you?" 
                value={feedback} 
                onChange={e => setFeedback(e.target.value)}
                rows={4}
              />
            </div>
            <Button className="w-full" onClick={submitReview} disabled={submittingReview || feedback.length < 5}>
              {submittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Select one of the mentor's next available slots:</p>
            {loadingSlots ? (
              <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : nextSlots.length === 0 ? (
              <div className="text-sm p-4 bg-muted/50 rounded text-center">No upcoming availability found. Please contact the mentor.</div>
            ) : (
              <div className="grid gap-2">
                {nextSlots.map((slot, i) => {
                  const d = new Date(slot.starts_at);
                  return (
                    <Button 
                      key={i} 
                      variant="outline" 
                      onClick={() => handleReschedule(slot.id)}
                      disabled={submittingReschedule}
                      className="justify-start gap-3"
                    >
                      <Calendar className="h-4 w-4" /> {d.toLocaleDateString()} at {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>If you encountered a severe issue with this booking, let us know.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={disputeCategory} onValueChange={setDisputeCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_show">Mentor did not show up</SelectItem>
                  <SelectItem value="inappropriate_behavior">Inappropriate behavior</SelectItem>
                  <SelectItem value="poor_quality">Poor session quality</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea 
                placeholder="Please describe what happened..." 
                value={disputeDescription} 
                onChange={e => setDisputeDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Button className="w-full" variant="destructive" onClick={submitDispute} disabled={submittingDispute || disputeDescription.length < 10}>
              {submittingDispute && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Dispute
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
