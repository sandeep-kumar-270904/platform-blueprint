import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, StopCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ScholarshipBuddy: React.FC = () => {
  const [buddyState, setBuddyState] = useState<'none' | 'waiting' | 'matched' | 'loading'>('loading');
  const [pairing, setPairing] = useState<any>(null);
  const [buddyProgress, setBuddyProgress] = useState<any>(null);

  const fetchBuddyState = async () => {
    try {
      setBuddyState('loading');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarship-buddies/my-pairing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'waiting') {
          setBuddyState('waiting');
        } else if (data.pairing) {
          setBuddyState('matched');
          setPairing(data.pairing);
          setBuddyProgress(data.buddyProgress);
        } else {
          setBuddyState('none');
        }
      } else if (res.status === 404) {
        setBuddyState('none');
      }
    } catch (err) {
      console.error(err);
      setBuddyState('none');
    }
  };

  useEffect(() => {
    fetchBuddyState();
  }, []);

  const handleRequestMatch = async () => {
    try {
      setBuddyState('loading');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarship-buddies/request-match`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Opted in for an application buddy!");
        fetchBuddyState();
      } else {
        toast.error("Failed to request match");
        setBuddyState('none');
      }
    } catch (err) {
      toast.error("Error requesting match");
      setBuddyState('none');
    }
  };

  const handleEndPairing = async () => {
    if (!confirm('Are you sure you want to end this buddy pairing?')) return;
    try {
      setBuddyState('loading');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarship-buddies/my-pairing`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Pairing ended. You can find a new buddy anytime.");
        fetchBuddyState();
      }
    } catch (err) {
      toast.error("Error ending pairing");
      fetchBuddyState();
    }
  };

  if (buddyState === 'loading') {
    return (
      <Card className="mb-8">
        <CardContent className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent>
      </Card>
    );
  }

  if (buddyState === 'waiting') {
    return (
      <Card className="mb-8 border-dashed border-primary/50 bg-primary/5">
        <CardContent className="py-8 text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto opacity-50" />
          <div>
            <h3 className="font-semibold text-primary">Looking for a match...</h3>
            <p className="text-sm text-primary/70">We are pairing you with someone who matches your application cadence.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (buddyState === 'matched' && pairing) {
    return (
      <Card className="mb-8 border-primary/20 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" /> Your Application Buddy
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleEndPairing} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8">
              <StopCircle className="h-4 w-4 mr-2" /> End pairing
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">Keep each other accountable! You can share specific scholarships with your buddy, and track their weekly progress.</p>
              
              <div className="bg-secondary/20 p-3 rounded-lg border border-border/50">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Buddy's Recent Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{buddyProgress?.submittedThisWeek || 0}</div>
                    <div className="text-xs text-muted-foreground">Applications submitted this week</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{buddyProgress?.inProgress || 0}</div>
                    <div className="text-xs text-muted-foreground">Currently drafting</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-dashed bg-muted/10">
      <CardContent className="py-8 text-center space-y-4">
        <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
        <div>
          <h3 className="font-semibold">Find an Application Buddy</h3>
          <p className="text-sm text-muted-foreground">Stay accountable by pairing up with another student working on scholarships.</p>
        </div>
        <Button onClick={handleRequestMatch}>Find a Buddy</Button>
      </CardContent>
    </Card>
  );
};


