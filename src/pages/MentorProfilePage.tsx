import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { BookingModal } from "@/components/BookingModal";
import { Star, CheckCircle2, Calendar as CalendarIcon, Clock, DollarSign, Globe, ArrowLeft, Share2, Users, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { type AvailabilitySlot } from "@/hooks/useMentors";
import { io } from "socket.io-client";

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    fetchMentor();
    fetchReviews();
    fetchSlots();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.on('mentor_slots_updated', (updatedId) => {
      if (updatedId === id) fetchSlots();
    });
    return () => { socket.disconnect(); };
  }, [id]);

  const fetchMentor = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/${id}`);
      if (res.ok) setMentor(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/${id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/${id}/availability`);
      if (res.ok) setSlots(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Copied!", description: "Profile link copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Mentor Not Found</h2>
          <p className="text-muted-foreground mb-6">This profile may have been removed or doesn't exist.</p>
          <Link to="/mentors"><Button>Back to Mentors</Button></Link>
        </div>
      </div>
    );
  }

  const dateKey = selectedDate?.toISOString().split("T")[0];
  const availableSlots = slots.filter((s) => !s.is_booked && s.starts_at.startsWith(dateKey || ""));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
          <Link to="/mentors"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Mentors</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                  <AvatarImage src={mentor.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {mentor.profile?.full_name?.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                    {mentor.profile?.full_name || mentor.profile?.username}
                    {mentor.verificationStatus === 'approved' && <CheckCircle2 className="h-5 w-5 text-accent" />}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-2">{mentor.title} {mentor.company ? `at ${mentor.company}` : ''}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium text-foreground">{Number(mentor.rating).toFixed(1)}</span>
                      <span>({mentor.reviewsCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{mentor.totalSessions} sessions completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>{mentor.languages?.join(", ") || "English"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-3">About Me</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mentor.bio || "No bio provided."}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise?.map((e: string) => (
                  <Badge key={e} variant="secondary">{e}</Badge>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t">
              <h3 className="text-xl font-semibold mb-6">Mentee Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground italic">No reviews yet.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <Card key={review._id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.menteeId?.avatar_url} />
                              <AvatarFallback>{review.menteeId?.full_name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{review.menteeId?.full_name || "Anonymous User"}</div>
                              <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm mt-3">{review.writtenFeedback}</p>
                        {review.mentorReply && (
                          <div className="mt-4 bg-muted/50 p-3 rounded-md text-sm">
                            <span className="font-semibold block mb-1">Mentor Reply:</span>
                            {review.mentorReply}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6 pb-6 border-b">
                  <div className="text-3xl font-bold mb-1">
                    {mentor.pricePerHour === 0 ? "Free" : `₹${mentor.pricePerHour}`}
                    {mentor.pricePerHour > 0 && <span className="text-sm font-normal text-muted-foreground">/hr</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">1-on-1 Session</p>
                </div>

                <h4 className="font-semibold mb-4 text-center">Select a Date</h4>
                <div className="flex justify-center mb-6">
                  <Calendar 
                    mode="single" 
                    selected={selectedDate} 
                    onSelect={setSelectedDate} 
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || d > new Date(Date.now() + 30 * 86400000)}
                    className="rounded-md border shadow-sm"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Available Slots</h4>
                    <span className="text-xs text-muted-foreground">{dateKey}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.length > 0 ? (
                      availableSlots.map(slot => (
                        <Button 
                          key={slot.id} 
                          variant="outline" 
                          size="sm"
                          onClick={() => { setPickedSlot(slot); setBookingOpen(true); }}
                        >
                          {new Date(slot.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Button>
                      ))
                    ) : (
                      <p className="col-span-2 text-sm text-center py-4 text-muted-foreground bg-muted/30 rounded-md">
                        No available slots on this date
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-center text-muted-foreground mt-4">
                  Times are shown in your local timezone.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} mentor={mentor} slot={pickedSlot} />
    </div>
  );
}
