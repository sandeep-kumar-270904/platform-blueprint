import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Trophy, Clock, ArrowLeft, Loader2, CheckCircle2, Star, MessageSquare } from "lucide-react";
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
        
        // Fetch feedback if event is completed
        if (data.status === 'completed') {
          fetch(`${API_URL}/api/events/${id}/feedback`)
            .then(r => r.json())
            .then(fData => setFeedbacks(fData.feedbacks || []))
            .catch(console.error);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load event details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

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
      setMyStatus(data.status); // 'registered' or 'waitlisted'
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
        // ignore scan errors
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
      
      // Refresh feedbacks
      fetch(`${API_URL}/api/events/${id}/feedback`)
        .then(r => r.json())
        .then(fData => setFeedbacks(fData.feedbacks || []));
        
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return <div className="min-h-screen pt-24 text-center">Event not found</div>;
  }

  const isHost = user && (event.hostedBy._id === user.id || event.hostedBy === user.id);
  const isFull = event.capacity && (event.registrationCount || 0) >= event.capacity;
  const isPast = new Date(event.startDate) < new Date(new Date().setHours(0,0,0,0));
  const deadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: 'long', month: "long", day: "numeric", year: "numeric" });
  const typeColor = (t: string) => ({ hackathon: "accent", competition: "warning", workshop: "success", seminar: "secondary" } as any)[t] || "default";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/events")} className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>

        {event.bannerImage && (
          <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8 shadow-sm">
            <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex gap-2 mb-3">
                <Badge variant={typeColor(event.eventType)} className="capitalize">{event.eventType}</Badge>
                <Badge variant="outline">{event.isVirtual ? "Virtual" : "In-Person"}</Badge>
                {event.status === 'pending_approval' && <Badge variant="secondary">Pending Approval</Badge>}
              </div>
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              <p className="text-muted-foreground text-lg whitespace-pre-wrap">{event.description}</p>
            </div>

            {event.prizes && event.prizes.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Prizes</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {event.prizes.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {isHost && (
              <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Host Dashboard</h2>
                <Tabs defaultValue="attendees">
                  <TabsList>
                    <TabsTrigger value="attendees">Attendees ({attendees.length})</TabsTrigger>
                    <TabsTrigger value="manage">Manage Event</TabsTrigger>
                  </TabsList>
                  <TabsContent value="attendees" className="mt-4">
                    {!event.isVirtual && (
                      <div className="mb-4 flex gap-2">
                        <Button variant="outline" onClick={() => setScanModalOpen(true)}>Scan Check-In QR</Button>
                      </div>
                    )}
                    <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Scan Attendee QR</DialogTitle></DialogHeader>
                        <div id="reader" className="w-full"></div>
                      </DialogContent>
                    </Dialog>
                    <Card>
                      <CardContent className="p-0">
                        {attendees.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">No attendees registered yet.</div>
                        ) : (
                          <div className="divide-y">
                            {attendees.map(a => (
                              <div key={a._id} className="p-4 flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{a.userId.full_name || a.userId.username}</div>
                                  <div className="text-sm text-muted-foreground">{a.userId.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={a.status === 'waitlisted' ? 'warning' : 'success'} className="capitalize">{a.status}</Badge>
                                  {!event.isVirtual && a.status === 'registered' && (
                                    a.checkedIn ? (
                                      <Badge variant="success">Checked In</Badge>
                                    ) : (
                                      <Button variant="outline" size="sm" onClick={() => handleCheckIn(a._id)}>Check In</Button>
                                    )
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="manage" className="mt-4">
                    <Button variant="outline">Edit Event Details</Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {event.status === 'completed' && (
              <div className="mt-12 border-t pt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Attendee Feedback</h2>
                  {myStatus === 'registered' && !feedbacks.some(f => f.userId._id === user?.id) && (
                    <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                      <DialogTrigger asChild>
                        <Button>Rate This Event</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate "{event.title}"</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Rating (1-5)</Label>
                            <div className="flex gap-2 mt-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  className={`h-8 w-8 cursor-pointer ${star <= feedbackForm.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
                                  onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="review-optional">Review (Optional)</Label><Textarea id="review-optional" 
                              placeholder="What did you think of the event?" 
                              value={feedbackForm.reviewText}
                              onChange={e => setFeedbackForm(prev => ({ ...prev, reviewText: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="recommend" 
                              checked={feedbackForm.wouldRecommend}
                              onCheckedChange={(c) => setFeedbackForm(prev => ({ ...prev, wouldRecommend: !!c }))}
                            />
                            <Label htmlFor="recommend" className="cursor-pointer">I would recommend this event to others</Label>
                          </div>
                          <Button className="w-full mt-4" onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                            {submittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Feedback"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No feedback has been submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((f: any) => (
                      <Card key={f._id} className="bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between mb-2">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {f.userId.full_name || f.userId.username}
                              {f.wouldRecommend && <Badge variant="success" className="text-[10px] py-0 h-4">Recommended</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                              {f.rating} <Star className="h-3 w-3 fill-warning text-warning" />
                            </div>
                          </div>
                          {f.reviewText && <p className="text-sm text-muted-foreground">{f.reviewText}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <h3 className="font-semibold text-lg">Event Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">{fmtDate(event.startDate)}</div>
                    <div className="text-sm text-muted-foreground">{event.startTime} - {event.endTime}</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">{event.isVirtual ? "Virtual Event" : event.venue}</div>
                    {event.isVirtual && <div className="text-sm text-muted-foreground">{event.venue}</div>}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">Hosted by</div>
                    <div className="text-sm text-muted-foreground">{event.hostName}</div>
                  </div>
                </div>

                {event.registrationRequired && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Registration</span>
                      <span className="font-medium">{event.registrationCount || 0} / {event.capacity || '∞'}</span>
                    </div>
                    {event.capacity && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(((event.registrationCount || 0) / event.capacity) * 100, 100)}%` }} 
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  {isPast ? (
                    <Button className="w-full" disabled>Event has ended</Button>
                  ) : myStatus ? (
                    <div className="space-y-2">
                      <Button variant="success" className="w-full bg-success/10 text-success hover:bg-success/20 cursor-default">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {myStatus === 'waitlisted' ? 'On Waitlist' : 'Registered'}
                      </Button>
                      <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleCancel}>Cancel Registration</Button>
                    </div>
                  ) : deadlinePassed ? (
                    <Button className="w-full" disabled>Registration Closed</Button>
                  ) : (
                    <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant={isFull ? "secondary" : "default"} onClick={(e) => {
                          if (event.eventType !== 'hackathon' && event.eventType !== 'competition') {
                            e.preventDefault();
                            handleRegister();
                          }
                        }}>
                          {isFull ? "Join Waitlist" : "Register Now"}
                        </Button>
                      </DialogTrigger>
                      {(event.eventType === 'hackathon' || event.eventType === 'competition') && (
                        <DialogContent>
                          <DialogHeader><DialogTitle>Register for {event.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="lookingForTeammates" 
                                checked={lookingForTeammates} 
                                onCheckedChange={(c) => setLookingForTeammates(!!c)} 
                              />
                              <Label htmlFor="lookingForTeammates">I am registering solo and looking for teammates</Label>
                            </div>
                            {lookingForTeammates ? (
                              <div>
                                <Label htmlFor="my-skills-interests-short-tag">My Skills/Interests (Short Tag)</Label><Input id="my-skills-interests-short-tag" placeholder="e.g. Frontend, ML, Design" value={skills} onChange={e => setSkills(e.target.value)} />
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor="team-name">Team Name</Label><Input id="team-name" placeholder="My Awesome Team" value={teamName} onChange={e => setTeamName(e.target.value)} />
                                <p className="text-xs text-muted-foreground mt-1">If your friend shared a team name, enter it here to join them.</p>
                              </div>
                            )}
                            <Button className="w-full" onClick={handleRegister}>Confirm Registration</Button>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {myStatus === 'registered' && myRegDetails?.teamName && !myRegDetails?.lookingForTeammates && (
              <Card className="mt-6 border-success/20 bg-success/5">
                <CardHeader className="pb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="h-4 w-4 text-success" /> Team: {myRegDetails.teamName}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">Share this link with your friends so they can join your team directly:</p>
                  <div className="flex gap-2">
                    <Input readOnly value={`${window.location.origin}/events/${id}?teamJoin=${encodeURIComponent(myRegDetails.teamName)}`} />
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/events/${id}?teamJoin=${encodeURIComponent(myRegDetails.teamName)}`);
                      toast({ title: "Copied to clipboard!" });
                    }}>Copy</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {myStatus === 'registered' && myRegDetails?.lookingForTeammates && (
              <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardHeader className="pb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Find Teammates</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incomingRequests.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h4 className="text-sm font-semibold">Incoming Requests</h4>
                      {incomingRequests.map(req => (
                        <div key={req._id} className="flex items-center justify-between bg-background p-2 rounded border">
                          <span className="text-sm">{req.fromUserId.full_name || req.fromUserId.username}</span>
                          <Button size="sm" onClick={() => handleAcceptTeamRequest(req._id)}>Accept</Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {teammates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No other solo registrants looking for teams right now.</p>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Solo Registrants</h4>
                      {teammates.map(tm => {
                        const hasSent = outgoingRequests.some(r => r.toUserId === tm.userId._id);
                        return (
                          <div key={tm._id} className="flex items-center justify-between bg-background p-2 rounded border">
                            <div>
                              <div className="text-sm font-medium">{tm.userId.full_name || tm.userId.username}</div>
                              {tm.skills && <Badge variant="secondary" className="text-[10px] mt-1">{tm.skills}</Badge>}
                            </div>
                            <Button size="sm" variant={hasSent ? "secondary" : "default"} disabled={hasSent} onClick={() => handleSendTeamRequest(tm.userId._id)}>
                              {hasSent ? 'Sent' : 'Request'}
                            </Button>
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
