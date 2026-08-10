import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Trophy, Clock, ArrowLeft, Loader2, CheckCircle2, Star, MessageSquare, ExternalLink, Globe, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { EventRow } from "@/hooks/useEvents";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";
import QRCode from "react-qr-code";
import { Html5QrcodeScanner } from "html5-qrcode";
import { formatDistanceToNowStrict, isPast as isDatePast, isFuture } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [myRegDetails, setMyRegDetails] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, reviewText: "", wouldRecommend: true });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Discussions states
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionText, setDiscussionText] = useState("");
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  // Team Formation states
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [lookingForTeammates, setLookingForTeammates] = useState(false);
  const [skills, setSkills] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teammates, setTeammates] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);

  // QR Check-in states
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        setEvent({ ...data, id: data._id });
        
        // Also fetch user's registration status
        const token = localStorage.getItem('token');
        if (token && user) {
          fetch(`${API_URL}/api/events/${id}/registrations/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(r => r.ok ? r.json() : null)
          .then(reg => {
            if (reg) {
              setMyStatus(reg.status);
              setMyRegDetails(reg);
            }
          })
          .catch(console.error);
        }
        
        if (data.status === 'completed' || data.lifecycleStatus === 'completed') {
          fetch(`${API_URL}/api/events/${id}/feedback`)
            .then(r => r.json())
            .then(fData => setFeedbacks(fData.feedbacks || []))
            .catch(console.error);
        }

        fetch(`${API_URL}/api/events/${id}/discussions`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
          .then(r => r.ok ? r.json() : [])
          .then(setDiscussions)
          .catch(console.error);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load event details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      
      if (event.isExternalContent) {
        setCountdown("Community Content");
      } else if (event.lifecycleStatus === 'cancelled') {
        setCountdown("Event Cancelled");
      } else if (event.lifecycleStatus === 'completed' || now >= end) {
        setCountdown("Event Completed");
      } else if (now >= start && now < end || event.lifecycleStatus === 'live') {
        setCountdown("LIVE NOW");
      } else {
        setCountdown(`Starts in ${formatDistanceToNowStrict(start)}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    const socket = io(API_URL);
    socket.on('event_updated', (data: any) => {
      if (!data || data.eventId === id) {
        fetch(`${API_URL}/api/events/${id}`)
          .then(r => r.json())
          .then(d => setEvent(prev => ({ ...prev, ...d, id: d._id })))
          .catch(console.error);
      }
    });
    return () => { socket.disconnect(); };
  }, [id]);

  const loadAttendees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/attendees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTeammates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/teammates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeammates(data.teammates || []);
        setIncomingRequests(data.incomingRequests || []);
        setOutgoingRequests(data.outgoingRequests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (event && user) {
      if (event.hostedBy._id === user.id || event.hostedBy === user.id) {
        loadAttendees();
      }
      loadTeammates();
      
      const searchParams = new URLSearchParams(window.location.search);
      const teamJoin = searchParams.get('teamJoin');
      if (teamJoin && !myStatus && event.eventType !== 'seminar' && event.eventType !== 'workshop') {
        setTeamName(teamJoin);
        setRegisterModalOpen(true);
      }
    }
  }, [event, user, myStatus]);

  const handleRegister = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (event?.eventType === 'hackathon' || event?.eventType === 'competition') {
      if (!registerModalOpen) {
        setRegisterModalOpen(true);
        return;
      }
    }
    
    const isFull = event?.capacity && (event?.registrationCount || 0) >= event?.capacity;
    const optimisticStatus = isFull ? 'waitlisted' : 'registered';
    const prevStatus = myStatus;
    setMyStatus(optimisticStatus);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookingForTeammates, skills, teamName })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message === 'Already registered') {
          setMyStatus('registered');
          toast({ title: "You are already registered!" });
          setRegisterModalOpen(false);
          return;
        }
        throw new Error(data.message || 'Registration failed');
      }
      setMyStatus(data.status); 
      setMyRegDetails({ lookingForTeammates, skills, teamName });
      setRegisterModalOpen(false);
      toast({ title: "Successfully Registered!" });
    } catch (err: any) {
      setMyStatus(prevStatus); // revert
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSendTeamRequest = async (toUserId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/team-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId })
      });
      if (!res.ok) throw new Error("Failed to send request");
      toast({ title: "Team Request Sent!" });
      loadTeammates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAcceptTeamRequest = async (reqId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/team-requests/${reqId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to accept request");
      toast({ title: "Team Request Accepted!" });
      loadTeammates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId })
      });
      if (!res.ok) throw new Error("Failed to check in");
      toast({ title: "Attendee Checked In!" });
      loadAttendees();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (scanModalOpen) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render((decodedText) => {
        handleCheckIn(decodedText);
        scanner.clear();
        setScanModalOpen(false);
      }, (err) => {
      });
      return () => { scanner.clear(); };
    }
  }, [scanModalOpen]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    
    const prevStatus = myStatus;
    setMyStatus(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/register`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to cancel");
      toast({ title: "Registration cancelled" });
    } catch (err: any) {
      setMyStatus(prevStatus); // revert
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user) return;
    setSubmittingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/feedback`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit feedback");
      
      toast({ title: "Feedback Submitted", description: "Thank you for your feedback!" });
      setFeedbackOpen(false);
      
      fetch(`${API_URL}/api/events/${id}/feedback`)
        .then(r => r.json())
        .then(fData => setFeedbacks(fData.feedbacks || []));
        
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!discussionText.trim()) return;
    setSubmittingDiscussion(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/discussions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: discussionText })
      });
      if (!res.ok) throw new Error('Failed to post message');
      const data = await res.json();
      setDiscussions(prev => [data, ...prev]);
      setDiscussionText("");
      toast({ title: "Message posted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/discussions/${discussionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete message');
      setDiscussions(prev => prev.filter(d => d._id !== discussionId));
      toast({ title: "Message deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return <div className="min-h-screen pt-24 text-center">Event not found</div>;
  }

  const isHost = user && (event.hostedBy?._id === user.id || event.hostedBy === user.id);
  const isFull = event.capacity && (event.registrationCount || 0) >= event.capacity;
  const isPast = event.lifecycleStatus === 'completed' || new Date(event.endDate) <= new Date();
  const deadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: 'long', month: "long", day: "numeric", year: "numeric" });
  
  const isExternal = event.source && event.source.provider !== 'INTERNAL';
  const isExternalContent = event.isExternalContent || event.eventType === 'community_content';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/events")} className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>

        {/* EVENT HERO */}
        <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-12 shadow-md bg-muted flex items-end">
          {event.bannerImage ? (
            <>
              <img src={event.bannerImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-accent/80" />
          )}
          
          <div className="relative z-10 w-full p-6 md:p-12 text-white">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white capitalize px-3 py-1 text-xs font-semibold tracking-wider">
                {event.eventType}
              </Badge>
              <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white px-3 py-1 text-xs font-semibold tracking-wider">
                {event.isVirtual ? "Virtual" : "Offline"}
              </Badge>
              {isExternal && (
                <Badge className="bg-blue-600/90 text-white hover:bg-blue-600 border-none px-3 py-1 text-xs font-semibold tracking-wider">
                  <Globe className="w-3 h-3 mr-1" /> External Event
                </Badge>
              )}
              {event.lifecycleStatus === 'live' && (
                <Badge variant="destructive" className="animate-pulse px-3 py-1 text-xs font-semibold tracking-wider">
                  LIVE NOW
                </Badge>
              )}
              {event.lifecycleStatus === 'cancelled' && (
                <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold tracking-wider">
                  CANCELLED
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{event.title}</h1>
            
            <div className="flex items-center gap-2 text-white/80 font-medium">
              <User className="w-4 h-4" />
              <span>Hosted by <span className="text-white font-semibold">{event.hostName}</span></span>
              {isExternal && <span className="text-white/60 text-sm ml-2">• Source: {event.source?.provider}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          {/* LEFT COLUMN - ABOUT & DISCUSSIONS */}
          <div className="lg:col-span-2 space-y-12">
            
            <section className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <h2 className="text-2xl font-bold mb-4">About this event</h2>
              <p className="text-muted-foreground text-lg whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </section>

            {event.prizes && event.prizes.length > 0 && (
              <section className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-warning" /> Prizes</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {event.prizes.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </section>
            )}

            {isHost && (
              <section className="border-t pt-8">
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Host Dashboard</h2>
                    <p className="text-muted-foreground text-sm">Manage your attendees, edit details, and export data.</p>
                  </div>
                  <Button onClick={() => navigate(`/events/${event.id}/manage`)}>Manage Event</Button>
                </div>
              </section>
            )}

            {/* EVENT DISCUSSION */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Discussion</h2>
              {user ? (
                <div className="mb-8 bg-muted/30 p-6 rounded-2xl border">
                  <Textarea 
                    placeholder="Ask a question or share a thought about this event..." 
                    value={discussionText}
                    onChange={e => setDiscussionText(e.target.value)}
                    className="mb-4 bg-background resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handlePostDiscussion} disabled={submittingDiscussion || !discussionText.trim()}>
                      {submittingDiscussion ? "Posting..." : "Post Message"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 bg-muted/30 border rounded-2xl text-center">
                  <p className="text-muted-foreground mb-4">Log in to participate in the discussion.</p>
                  <Button variant="outline" onClick={() => navigate("/auth")}>Login to Post</Button>
                </div>
              )}
              
              <div className="space-y-4">
                {discussions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
                    No discussions yet. Be the first to post!
                  </div>
                ) : (
                  discussions.map(d => (
                    <div key={d._id} className="p-5 rounded-2xl border bg-card flex gap-4 shadow-sm transition-all hover:shadow-md">
                      <img src={d.userId.avatar_url || "https://ui-avatars.com/api/?name="+encodeURIComponent(d.userId.full_name || d.userId.username)} alt="" className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-sm">{d.userId.full_name || d.userId.username}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{new Date(d.createdAt).toLocaleString()}</div>
                          </div>
                          {(user?.id === d.userId._id || isHost) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDiscussion(d._id)}>
                              &times;
                            </Button>
                          )}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed">{d.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - STICKY LOGISTICS CARD */}
          <div className="space-y-6">
            <Card className="sticky top-24 shadow-lg border-muted/60 rounded-2xl overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b">
                <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">
                  {countdown}
                </div>
                <h3 className="font-bold text-xl">Logistics</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                
                {!isExternalContent && (
                  <div className="flex gap-4">
                    <div className="mt-1 bg-muted p-2 rounded-lg shrink-0 h-min">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{event.startDate ? fmtDate(event.startDate) : 'TBD'}</div>
                      <div className="text-sm text-muted-foreground mt-1">{event.startTime || ''} - {event.endTime || ''} {event.timezone ? `(${event.timezone})` : ""}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="mt-1 bg-muted p-2 rounded-lg shrink-0 h-min">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{event.isVirtual ? "Virtual Event" : event.venue}</div>
                    {event.isVirtual && <div className="text-sm text-muted-foreground mt-1">{event.venue}</div>}
                  </div>
                </div>

                {event.registrationRequired && !isExternal && (
                  <div className="pt-6 border-t">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Registration</span>
                      <span className="font-semibold">{event.registrationCount || 0} / {event.capacity || '∞'} spots filled</span>
                    </div>
                    {event.capacity && (
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-500 ease-out" 
                          style={{ width: `${Math.min(((event.registrationCount || 0) / event.capacity) * 100, 100)}%` }} 
                        />
                      </div>
                    )}
                    {event.registrationDeadline && (
                      <div className="text-xs text-muted-foreground mt-3 text-right">
                        Closes {new Date(event.registrationDeadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6 border-t space-y-3">
                  {isExternal ? (
                    <>
                      {isExternalContent && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-4 text-center">
                          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                            This is community content discovered from {event.source?.provider}.
                          </p>
                        </div>
                      )}
                      {!isExternalContent && (
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          Registration for this event is handled by the external organizer on {event.source?.provider}.
                        </p>
                      )}
                      <Button 
                        size="lg"
                        className="w-full font-bold text-md" 
                        onClick={() => window.open(event.source.externalUrl || event.externalRegistrationLink, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-5 w-5" /> View on {event.source?.provider}
                      </Button>
                    </>
                  ) : event.lifecycleStatus === 'cancelled' ? (
                    <div className="space-y-3">
                      <Button size="lg" variant="destructive" className="w-full font-bold text-md cursor-not-allowed">
                        Event Cancelled
                      </Button>
                      {myStatus && (
                         <div className="text-sm text-muted-foreground text-center">
                           Your registration ({myStatus}) has been voided.
                         </div>
                      )}
                    </div>
                  ) : isPast ? (
                    <div className="space-y-3">
                      <Button size="lg" variant="secondary" className="w-full font-bold text-md cursor-not-allowed">
                        Event has ended
                      </Button>
                      {myStatus && (
                        <div className="text-sm text-success text-center font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> You {myStatus === 'waitlisted' ? 'were on the waitlist' : 'attended this event'}
                        </div>
                      )}
                      {myStatus === 'registered' && (
                        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full shadow-sm">
                              <Star className="mr-2 h-4 w-4" /> Rate & Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Rate {event.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Rating (1-5)</Label>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                      key={star} 
                                      className={`h-8 w-8 cursor-pointer transition-colors ${feedbackForm.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`}
                                      onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Review</Label>
                                <Textarea 
                                  placeholder="What did you think of the event?" 
                                  value={feedbackForm.reviewText} 
                                  onChange={e => setFeedbackForm({...feedbackForm, reviewText: e.target.value})}
                                  className="min-h-[100px]"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="recommend" 
                                  checked={feedbackForm.wouldRecommend} 
                                  onCheckedChange={c => setFeedbackForm({...feedbackForm, wouldRecommend: !!c})}
                                />
                                <Label htmlFor="recommend">I would recommend this event</Label>
                              </div>
                              <Button className="w-full" onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  ) : myStatus ? (
                    <div className="space-y-3">
                      <Button size="lg" variant="success" className="w-full font-bold text-md bg-success/10 text-success hover:bg-success/20 cursor-default border border-success/20">
                        <CheckCircle2 className="mr-2 h-5 w-5" /> {myStatus === 'waitlisted' ? 'On Waitlist' : 'Registered'}
                      </Button>
                      <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive" onClick={handleCancel}>Cancel Registration</Button>
                    </div>
                  ) : deadlinePassed ? (
                    <Button size="lg" variant="secondary" className="w-full font-bold text-md cursor-not-allowed">
                      Registration Closed
                    </Button>
                  ) : (
                    <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="w-full font-bold text-md" variant={isFull ? "secondary" : "default"} onClick={(e) => {
                          if (event.eventType !== 'hackathon' && event.eventType !== 'competition') {
                            e.preventDefault();
                            handleRegister();
                          }
                        }}>
                          {isFull ? "Join Waitlist" : "Register Now"}
                        </Button>
                      </DialogTrigger>
                      {(event.eventType === 'hackathon' || event.eventType === 'competition') && (
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader><DialogTitle className="text-xl">Register for {event.title}</DialogTitle></DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border">
                              <Checkbox 
                                id="lookingForTeammates" 
                                checked={lookingForTeammates} 
                                onCheckedChange={(c) => setLookingForTeammates(!!c)} 
                              />
                              <Label htmlFor="lookingForTeammates" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I am registering solo and looking for teammates
                              </Label>
                            </div>
                            
                            {lookingForTeammates ? (
                              <div className="space-y-2">
                                <Label htmlFor="my-skills" className="font-semibold">My Skills / Interests</Label>
                                <Input id="my-skills" placeholder="e.g. Frontend, ML, Design" value={skills} onChange={e => setSkills(e.target.value)} />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label htmlFor="team-name" className="font-semibold">Team Name</Label>
                                <Input id="team-name" placeholder="My Awesome Team" value={teamName} onChange={e => setTeamName(e.target.value)} />
                                <p className="text-xs text-muted-foreground">If a friend shared a team name, enter it here to join.</p>
                              </div>
                            )}
                            <Button size="lg" className="w-full font-bold" onClick={handleRegister}>Confirm Registration</Button>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {myStatus === 'registered' && myRegDetails?.teamName && !myRegDetails?.lookingForTeammates && (
              <Card className="border-success/30 bg-success/5 shadow-sm rounded-2xl">
                <CardHeader className="pb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="h-5 w-5 text-success" /> Team: {myRegDetails.teamName}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 text-muted-foreground">Share this link with your friends to let them join your team:</p>
                  <div className="flex gap-2">
                    <Input readOnly value={`${window.location.origin}/events/${id}?teamJoin=${encodeURIComponent(myRegDetails.teamName)}`} className="bg-background" />
                    <Button variant="outline" className="shrink-0" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/events/${id}?teamJoin=${encodeURIComponent(myRegDetails.teamName)}`);
                      toast({ title: "Copied to clipboard!" });
                    }}>Copy</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {myStatus === 'registered' && myRegDetails?.lookingForTeammates && (
              <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-2xl">
                <CardHeader className="pb-2">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Find Teammates</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incomingRequests.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Incoming Requests</h4>
                      {incomingRequests.map(req => (
                        <div key={req._id} className="flex items-center justify-between bg-background p-3 rounded-xl border shadow-sm">
                          <span className="text-sm font-medium">{req.fromUserId.full_name || req.fromUserId.username}</span>
                          <Button size="sm" onClick={() => handleAcceptTeamRequest(req._id)}>Accept</Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {teammates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 bg-background rounded-xl border border-dashed">No other solo registrants looking for teams right now.</p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Solo Registrants</h4>
                      {teammates.map(tm => {
                        const hasSent = outgoingRequests.some(r => r.toUserId === tm.userId._id);
                        return (
                          <div key={tm._id} className="flex flex-col gap-3 bg-background p-4 rounded-xl border shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-bold">{tm.userId.full_name || tm.userId.username}</div>
                                {tm.skills && <Badge variant="secondary" className="text-[10px] mt-1">{tm.skills}</Badge>}
                              </div>
                              <Button size="sm" variant={hasSent ? "secondary" : "default"} disabled={hasSent} onClick={() => handleSendTeamRequest(tm.userId._id)}>
                                {hasSent ? 'Sent' : 'Request'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
