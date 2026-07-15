import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Video, Loader2, Star, MessageSquare } from "lucide-react";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export const MyMentorBookings = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
    if (user && token) {
      fetchBookings();
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      socket.on(`my_bookings_updated_${user.id}`, () => {
        fetchBookings();
      });
      return () => { socket.disconnect(); };
    }
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
                    <Badge variant={booking.status === 'confirmed' ? 'default' : (booking.status === 'completed' ? 'secondary' : 'outline')}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {start.toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  
                  {booking.meetingLink && !past && (
                    <Button className="w-full gap-2" variant="outline" asChild>
                      <a href={booking.meetingLink} target="_blank" rel="noreferrer"><Video className="h-4 w-4" /> Join Video Call</a>
                    </Button>
                  )}

                  {past && (
                    <Button 
                      className="w-full gap-2" 
                      variant="secondary"
                      onClick={() => { setReviewingBooking(booking); setRating(5); setFeedback(""); setReviewModalOpen(true); }}
                    >
                      <Star className="h-4 w-4" /> Leave a Review
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
    </div>
  );
};
