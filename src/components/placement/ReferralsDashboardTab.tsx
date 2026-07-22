import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Inbox, CheckCircle, XCircle, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { ReferrerOptInModal } from './ReferrerOptInModal';
import { Star } from 'lucide-react';

export const ReferralsDashboardTab = () => {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status Update State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [updateAction, setUpdateAction] = useState<"accepted" | "declined" | "referred" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // New states
  const [showOptIn, setShowOptIn] = useState(false);
  const [ratingRequest, setRatingRequest] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const [sentRes, recRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/requests/sent`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/requests/received`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (sentRes.ok) setSentRequests(await sentRes.json());
      if (recRes.ok) setReceivedRequests(await recRes.json());
      
    } catch (err) {
      console.error("Failed to fetch referral requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !updateAction) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/requests/${selectedRequest._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          status: updateAction,
          response_message: responseMessage
        })
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success(`Request marked as ${updateAction}`);
      fetchRequests(); // Refresh
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingRequest || ratingValue === 0) return;
    setIsSubmittingRating(true);
    // Mock API call delay
    setTimeout(() => {
      setIsSubmittingRating(false);
      toast.success("Thank you for your feedback!");
      // Optimistically update local state to hide the rate button
      setSentRequests(prev => prev.map(req => 
        req._id === ratingRequest._id ? { ...req, hasBeenRated: true } : req
      ));
      setRatingRequest(null);
      setRatingValue(0);
      setRatingFeedback("");
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'accepted': return <Badge className="bg-blue-500">Accepted</Badge>;
      case 'referred': return <Badge className="bg-green-500">Referred</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Referral Center</h2>
          <p className="text-muted-foreground">Manage your referral requests and inbox.</p>
        </div>
        <Button onClick={() => setShowOptIn(true)} className="gap-2">
          <CheckCircle className="w-4 h-4" /> Become a Referrer
        </Button>
      </div>

      <ReferrerOptInModal open={showOptIn} onOpenChange={setShowOptIn} />

      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sent"><Send className="w-4 h-4 mr-2" /> My Requests</TabsTrigger>
          <TabsTrigger value="inbox"><Inbox className="w-4 h-4 mr-2" /> Inbox</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                You haven't sent any referral requests yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentRequests.map((req: any) => (
                <Card key={req._id}>
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border bg-white mt-1">
                        <AvatarImage src={req.company?.logoUrl} className="object-contain p-1" />
                        <AvatarFallback>{req.company?.name?.charAt(0) || 'C'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-lg">{req.company?.name}</h4>
                        <div className="text-sm text-muted-foreground flex gap-2 items-center">
                          <span>Role: {req.target_role}</span>
                          <span>•</span>
                          <span>Referrer: {req.referrer_profile?.user?.name}</span>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          "{req.message}"
                        </div>
                        {req.response_message && (
                          <div className="mt-2 text-sm bg-primary/5 p-2 rounded border-l-2 border-primary">
                            <strong>Reply: </strong> {req.response_message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getStatusBadge(req.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.status === 'referred' && !req.hasBeenRated && (
                        <Button variant="outline" size="sm" className="mt-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={() => setRatingRequest(req)}>
                          <Star className="w-4 h-4 mr-2" /> Rate Referral
                        </Button>
                      )}
                      {req.status === 'referred' && req.hasBeenRated && (
                        <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Rated</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                Your referral inbox is empty. Make sure your profile is active in Account Settings!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {receivedRequests.map((req: any) => (
                <Card key={req._id} className={req.status === 'pending' ? 'border-primary/50 shadow-sm' : ''}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 border bg-white mt-1">
                          <AvatarImage src={req.requester?.avatarUrl} />
                          <AvatarFallback>{req.requester?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-lg">{req.requester?.name}</h4>
                          <div className="text-sm text-muted-foreground flex gap-2 items-center">
                            <span>Requesting for: <strong>{req.company?.name}</strong> ({req.target_role})</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {req.resumeSnapshot?.file_url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={req.resumeSnapshot.file_url} target="_blank" rel="noreferrer">
                              <Download className="w-4 h-4 mr-2" /> View Resume
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="outline">No Resume</Badge>
                        )}
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded text-sm whitespace-pre-wrap mb-4">
                      {req.message}
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end pt-2 border-t">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setUpdateAction('declined');
                          }}
                        >
                          Decline
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setUpdateAction('accepted');
                          }}
                        >
                          Accept
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setUpdateAction('referred');
                          }}
                        >
                          Mark Referred
                        </Button>
                      </div>
                    )}

                    {req.status === 'accepted' && (
                      <div className="flex gap-2 justify-end pt-2 border-t">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setUpdateAction('referred');
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark Referred
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateAction === 'accepted' ? 'Accept Request' : 
               updateAction === 'declined' ? 'Decline Request' : 
               'Mark as Referred'}
            </DialogTitle>
            <DialogDescription>
              Add an optional message to {selectedRequest?.requester?.name?.split(' ')[0]}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder={
                  updateAction === 'accepted' ? "e.g. I'll refer you shortly, please wait for the email." :
                  updateAction === 'declined' ? "e.g. Sorry, I can only refer folks with 2+ YOE." :
                  "e.g. Done! Check your email for the application link."
                }
                value={responseMessage}
                onChange={e => setResponseMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Referral Dialog */}
      <Dialog open={!!ratingRequest} onOpenChange={(open) => !open && setRatingRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your Referral Experience</DialogTitle>
            <DialogDescription>
              How was your interaction with {ratingRequest?.referrer_profile?.user?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`p-2 transition-colors ${ratingValue >= star ? 'text-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-400/50'}`}
                >
                  <Star className="w-10 h-10 fill-current" />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Additional Feedback (Optional)</Label>
              <Textarea 
                placeholder="Was the referrer responsive? Did they give any helpful tips?"
                value={ratingFeedback}
                onChange={e => setRatingFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingRequest(null)}>Cancel</Button>
            <Button onClick={handleSubmitRating} disabled={ratingValue === 0 || isSubmittingRating}>
              {isSubmittingRating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
