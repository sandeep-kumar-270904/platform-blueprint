import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, ChevronRight, Star, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderSummary {
  _id: string;
  name: string;
  category: string;
}

interface RepairRequest {
  _id: string;
  status: string;
  providerId: ProviderSummary;
  createdAt: string;
  isUrgent?: boolean;
}

interface PendingReview {
  requestId: string;
  providerId: ProviderSummary;
  completedAt: string;
}

interface DashboardSummary {
  activeRequests: RepairRequest[];
  savedProvidersCount: number;
  pendingReviews: PendingReview[];
}

export const RepairDashboardWidget = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const res = await fetch(`${API_URL}/api/repair/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setSummary(json.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch repair dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);

  const handleDismissPrompt = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Optimistically remove from UI
      if (summary) {
        setSummary({
          ...summary,
          pendingReviews: summary.pendingReviews.filter(r => r.requestId !== requestId)
        });
      }

      await fetch(`${API_URL}/api/repair/requests/${requestId}/dismiss-prompt`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Failed to dismiss prompt:", error);
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card animate-pulse">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
            <Wrench className="h-5 w-5" /> Repair & Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="h-24"></CardContent>
      </Card>
    );
  }

  // Graceful degradation / Empty State
  if (!summary || (summary.activeRequests.length === 0 && summary.savedProvidersCount === 0 && summary.pendingReviews.length === 0)) {
    return (
      <Card className="border-border bg-card hover:bg-muted/30 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-primary" /> Repair & Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Find trusted service providers for your AC, appliances, electrical, and more.
          </p>
          <Button asChild variant="default">
            <Link to="/repair">Explore Services</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-primary" /> Repair & Maintenance
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
          <Link to="/repair">View Directory <ChevronRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Pending Reviews Prompt */}
        {summary.pendingReviews.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Star className="h-4 w-4" /> Action Needed
            </h4>
            {summary.pendingReviews.map(review => (
              <div key={review.requestId} className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-3 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDismissPrompt(review.requestId)}
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="pr-6">
                  <p className="text-sm font-medium">How was your experience with {review.providerId?.name || 'Provider no longer available'}?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your service request is marked as completed.</p>
                </div>
                {review.providerId && (
                  <Button size="sm" asChild variant="outline" className="border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-900">
                    <Link to={`/repair/${review.providerId._id}?review=true`}>Leave a Review</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active Requests */}
        {summary.activeRequests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Active Service Requests
            </h4>
            <div className="space-y-2">
              {summary.activeRequests.map(req => (
                <Link 
                  key={req._id} 
                  to="/repair" 
                  className="block group"
                >
                  <div className={cn("border rounded-md p-3 flex justify-between items-center transition-colors", req.isUrgent ? "bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20" : "bg-muted/30 group-hover:bg-muted/60")}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{req.providerId?.name || 'Provider no longer available'}</p>
                        {req.isUrgent && (
                          <Badge variant="outline" className="text-[10px] uppercase text-red-500 border-red-500/30 bg-red-500/10 h-5 px-1.5">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{req.providerId?.category || 'Service'}</p>
                    </div>
                    <Badge variant={
                      req.status === 'Accepted' ? 'default' : 
                      req.status === 'In Progress' ? 'secondary' : 
                      'outline'
                    }>
                      {req.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </CardContent>
      
      {/* Footer / Saved count */}
      {summary.savedProvidersCount > 0 && (
        <CardFooter className="pt-0 pb-4">
          <Button variant="ghost" asChild className="w-full justify-between h-auto py-2 text-muted-foreground hover:text-foreground">
            <Link to="/repair?tab=saved">
              <span className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4" /> {summary.savedProvidersCount} Saved Provider{summary.savedProvidersCount !== 1 ? 's' : ''}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
