import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreVertical, Edit2, Trash2, ExternalLink, Star, Calendar, MessageCircle, MessageSquare, Ticket } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ReviewFormDialog } from "@/components/colleges/ReviewFormDialog";
import { QRScanner } from "@/components/events/QRScanner";
import { EditEventDialog } from "@/components/events/EditEventDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QRCode from "react-qr-code";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const MyActivity = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [hostedEvents, setHostedEvents] = useState<any[]>([]);
  const [registeredUpcoming, setRegisteredUpcoming] = useState<any[]>([]);
  const [registeredPast, setRegisteredPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Ticket States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrRegId, setQrRegId] = useState("");
  const [qrEventTitle, setQrEventTitle] = useState("");

  // Edit Q&A States
  const [editItem, setEditItem] = useState<{ type: 'question' | 'answer', data: any } | null>(null);
  const [editText, setEditText] = useState("");
  const [editEventItem, setEditEventItem] = useState<any>(null);

  // QR Checkin State
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanEventId, setScanEventId] = useState("");

  // Delete States
  const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'review' | 'question' | 'answer' | 'event' } | null>(null);
  const [cancelRegItem, setCancelRegItem] = useState<{ id: string } | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [revRes, qRes, aRes, eHostRes, eRegRes] = await Promise.all([
        fetch(`${API_URL}/api/users/me/reviews`, { headers }),
        fetch(`${API_URL}/api/users/me/questions`, { headers }),
        fetch(`${API_URL}/api/users/me/answers`, { headers }),
        fetch(`${API_URL}/api/users/me/events/hosting`, { headers }),
        fetch(`${API_URL}/api/users/me/events/registered`, { headers })
      ]);

      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews);
      }
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAnswers(aData.answers);
      }
      if (eHostRes.ok) {
        const data = await eHostRes.json();
        setHostedEvents(data.events);
      }
      if (eRegRes.ok) {
        const data = await eRegRes.json();
        setRegisteredUpcoming(data.upcoming);
        setRegisteredPast(data.past);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleEditSubmit = async () => {
    if (!editItem || !editText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const url = editItem.type === 'question' 
        ? `${API_URL}/api/college-qa/questions/${editItem.data._id}`
        : `${API_URL}/api/college-qa/answers/${editItem.data._id}`;

      const body = editItem.type === 'question'
        ? { questionText: editText }
        : { answerText: editText };

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(`${editItem.type === 'question' ? 'Question' : 'Answer'} updated successfully`);
      setEditItem(null);
      fetchActivity();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    try {
      const token = localStorage.getItem("token");
      let url = "";
      if (deleteItem.type === 'review') url = `${API_URL}/api/reviews/${deleteItem.id}`;
      else if (deleteItem.type === 'question') url = `${API_URL}/api/college-qa/questions/${deleteItem.id}`;
      else if (deleteItem.type === 'answer') url = `${API_URL}/api/college-qa/answers/${deleteItem.id}`;
      else if (deleteItem.type === 'event') url = `${API_URL}/api/events/${deleteItem.id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Item deleted successfully");
      setDeleteItem(null);
      fetchActivity();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  const handleCancelRegistration = async () => {
    if (!cancelRegItem) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/events/${cancelRegItem.id}/register`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to cancel registration");
      toast.success("Registration cancelled successfully");
      setCancelRegItem(null);
      fetchActivity();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel registration");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading activity...</div>;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-xl">My Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reviews">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="answers">Answers ({answers.length})</TabsTrigger>
            <TabsTrigger value="events">Events ({hostedEvents.length + registeredUpcoming.length + registeredPast.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 border border-dashed bg-muted/10 rounded-xl">
                <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground mb-4">You haven't written any reviews yet.</p>
                <Link to="/college-insights">
                  <Button variant="outline">Browse Colleges</Button>
                </Link>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{review.title}</h4>
                      <Link 
                        to={`/colleges/${review.collegeId?._id}`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {review.collegeId?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-warning/20 text-warning px-2 py-0.5 rounded text-sm font-medium">
                        {review.rating} <Star className="h-3 w-3 fill-warning ml-1" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <ReviewFormDialog 
                            collegeId={review.collegeId?._id}
                            review={review}
                            onSuccess={fetchActivity}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteItem({ id: review._id, type: 'review' })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                    {review.reviewText}
                  </p>
                  <div className="text-xs text-muted-foreground mt-4">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 border border-dashed bg-muted/10 rounded-xl">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
                <p className="text-muted-foreground mb-4">You haven't asked any questions yet.</p>
                <Link to="/college-insights">
                  <Button variant="outline">Browse Colleges</Button>
                </Link>
              </div>
            ) : (
              questions.map(q => (
                <div key={q._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{q.questionText}</p>
                      <Link 
                        to={`/colleges/${q.collegeId?._id}?tab=qa`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {q.collegeId?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditItem({ type: 'question', data: q });
                          setEditText(q.questionText);
                        }}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteItem({ id: q._id, type: 'question' })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                    <span>{q.answersCount} Answers</span>
                    <span>{q.upvotes} Upvotes</span>
                    <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="answers" className="space-y-4">
            {answers.length === 0 ? (
              <div className="text-center py-12 border border-dashed bg-muted/10 rounded-xl">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Answers Yet</h3>
                <p className="text-muted-foreground mb-4">You haven't answered any questions yet.</p>
                <Link to="/college-insights">
                  <Button variant="outline">Browse Colleges</Button>
                </Link>
              </div>
            ) : (
              answers.map(a => (
                <div key={a._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground italic mb-2 border-l-2 border-primary/30 pl-3">
                        "{a.questionId?.questionText}"
                      </p>
                      <p className="font-medium">{a.answerText}</p>
                      <Link 
                        to={`/colleges/${a.questionId?.collegeId?._id}?tab=qa`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        {a.questionId?.collegeId?.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditItem({ type: 'answer', data: a });
                          setEditText(a.answerText);
                        }}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteItem({ id: a._id, type: 'answer' })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                    <span>{a.upvotes} Upvotes</span>
                    <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Tabs defaultValue="hosting" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="hosting">Hosting ({hostedEvents.length})</TabsTrigger>
                <TabsTrigger value="registered">Registered ({registeredUpcoming.length + registeredPast.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hosting" className="space-y-4">
                {hostedEvents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed bg-muted/10 rounded-xl">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Events Hosted</h3>
                    <p className="text-muted-foreground mb-4">You haven't hosted any events yet.</p>
                    <Link to="/events">
                      <Button variant="outline">Host an Event</Button>
                    </Link>
                  </div>
                ) : (
                  hostedEvents.map((ev) => (
                    <div key={ev._id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`capitalize text-xs px-2 py-0.5 text-white rounded-full font-medium ${
                              ev.eventType === 'hackathon' ? 'bg-blue-600' :
                              ev.eventType === 'competition' ? 'bg-orange-600' :
                              ev.eventType === 'workshop' ? 'bg-purple-600' : 'bg-green-600'
                            }`}>
                              {ev.eventType}
                            </span>
                            <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${
                              ev.status === 'approved' ? 'bg-success/10 text-success' : 
                              ev.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                              'bg-warning/10 text-warning'
                            }`}>
                              {ev.status.replace('_', ' ')}
                            </span>
                            {ev.avgRating && (
                              <span className="flex items-center text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                                {ev.avgRating.toFixed(1)} <Star className="h-3 w-3 fill-warning text-warning ml-1" />
                                <span className="ml-1 text-[10px] text-muted-foreground">({ev.totalFeedbackCount || 0})</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-lg">{ev.title}</h4>
                          <Link 
                            to={`/events/${ev._id}`} 
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            View Event Page <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ev.status === 'approved' && !ev.isVirtual && (
                                <DropdownMenuItem onClick={() => {
                                  setScanEventId(ev._id);
                                  setScanModalOpen(true);
                                }}>
                                  <Ticket className="mr-2 h-4 w-4" /> Scan Tickets
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setEditEventItem(ev)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteItem({ id: ev._id, type: 'event' })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {ev.status === 'rejected' && ev.rejectionReason && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded mt-3">
                          <strong>Rejection Reason:</strong> {ev.rejectionReason}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {ev.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                        <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {new Date(ev.startDate).toLocaleDateString()}</span>
                        <span>{ev.isVirtual ? 'Virtual' : ev.venue}</span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="registered" className="space-y-8">
                {/* Upcoming */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Upcoming Events</h3>
                  {registeredUpcoming.length === 0 ? (
                    <div className="text-center py-6 border rounded-lg bg-muted/10">
                      <p className="text-muted-foreground text-sm">No upcoming events.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {registeredUpcoming.map((ev) => (
                        <div key={ev._id} className="border rounded-lg p-4 bg-card flex justify-between items-center">
                          <div>
                            <div className="flex gap-2 items-center mb-1">
                              <h4 className="font-semibold text-md">
                                <Link to={`/events/${ev._id}`} className="hover:underline">{ev.title}</Link>
                              </h4>
                              {ev.registrationStatus === 'waitlisted' && (
                                <span className="bg-warning/20 text-warning text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Waitlisted</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {new Date(ev.startDate).toLocaleDateString()} at {ev.startTime}</span>
                              <span>•</span>
                              <span className="capitalize">{ev.eventType}</span>
                              <div className="flex gap-2">
                                {!ev.event.isVirtual && ev.status === 'registered' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setQrRegId(ev._id);
                                      setQrEventTitle(ev.event.title);
                                      setQrModalOpen(true);
                                    }}
                                  >
                                    View QR Ticket
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => setCancelRegItem({ id: ev.event._id })}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                    <DialogContent className="sm:max-w-md text-center">
                      <DialogHeader>
                        <DialogTitle>Your Ticket for {qrEventTitle}</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                          {qrRegId && <QRCode value={qrRegId} size={200} />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                          Show this QR code to the host when checking in at the venue.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Past */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Past Events</h3>
                  {registeredPast.length === 0 ? (
                    <div className="text-center py-6 border rounded-lg bg-muted/10">
                      <p className="text-muted-foreground text-sm">No past events.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 opacity-70">
                      {registeredPast.map((ev) => (
                        <div key={ev._id} className="border rounded-lg p-4 bg-card flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-md">{ev.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {new Date(ev.startDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="capitalize">{ev.eventType}</span>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-muted-foreground border px-3 py-1 rounded-full bg-muted/50">
                            {ev.registrationStatus === 'waitlisted' ? 'Did not attend' : 'Attended'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>

      <EditEventDialog 
        event={editEventItem} 
        open={!!editEventItem} 
        onOpenChange={(open) => !open && setEditEventItem(null)} 
        onSuccess={fetchActivity} 
      />

      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Attendee Ticket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {scanModalOpen && (
              <QRScanner 
                onScan={async (decodedText) => {
                  try {
                    toast.loading("Checking in...", { id: "checkin" });
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${API_URL}/api/events/${scanEventId}/checkin`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ registrationId: decodedText })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(`Checked in successfully!`, { id: "checkin" });
                      setScanModalOpen(false);
                    } else {
                      throw new Error(data.message || "Invalid ticket");
                    }
                  } catch (err: any) {
                    toast.error(err.message, { id: "checkin" });
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Q&A Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editItem?.type === 'question' ? 'Question' : 'Answer'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your {deleteItem?.type} from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Registration Confirmation Alert */}
      <AlertDialog open={!!cancelRegItem} onOpenChange={(open) => !open && setCancelRegItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your RSVP? If there is a waitlist, you will lose your spot to the next person in line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Spot</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelRegistration}
            >
              Cancel RSVP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
