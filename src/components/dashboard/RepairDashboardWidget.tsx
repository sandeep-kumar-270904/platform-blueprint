import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, ChevronRight, Star, Clock, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuoteRequest } from "@/types/repair";
import { QuoteComparisonSheet } from "../repair/QuoteComparisonSheet";
import { RequestServiceModal } from "../repair/RequestServiceModal";
import { toast } from "@/components/ui/use-toast";
import { generateICS, downloadICS } from "@/utils/calendarUtils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CalendarPlus } from "lucide-react";

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
  preferredDate?: string;
  preferredTime?: string;
  issueDescription?: string;
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
  pastRequests?: RepairRequest[];
}

export const RepairDashboardWidget = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Rebook State
  const [rebookProvider, setRebookProvider] = useState<any | null>(null);
  const [rebookPrefill, setRebookPrefill] = useState<any | null>(null);
  const [isRebookModalOpen, setIsRebookModalOpen] = useState(false);

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
        
        const quotesRes = await fetch(`${API_URL}/api/repair/quotes`, {
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

        if (quotesRes.ok) {
          const quotesJson = await quotesRes.json();
          if (quotesJson.success) {
            setQuoteRequests(quotesJson.data);
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

  const refreshQuotes = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const quotesRes = await fetch(`${API_URL}/api/repair/quotes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (quotesRes.ok) {
        const quotesJson = await quotesRes.json();
        if (quotesJson.success) {
          setQuoteRequests(quotesJson.data);
          if (selectedQuoteRequest) {
            const updated = quotesJson.data.find((q: QuoteRequest) => q._id === selectedQuoteRequest._id);
            setSelectedQuoteRequest(updated || null);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

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

  const handleRebook = async (requestId: string, providerSummary: ProviderSummary) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${API_URL}/api/repair/requests/${requestId}/rebook`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: json.error || "Failed to fetch rebook data", variant: "destructive" });
        return;
      }
      
      const { providerStatus, category, issueDescription, notes } = json.data;
      if (!providerStatus.isActive) {
        toast({ title: "Provider Unavailable", description: "This provider is no longer active on the platform.", variant: "destructive" });
        return;
      }
      
      // Mock enough provider data for the RequestServiceModal to work
      const mockedProvider = {
        id: providerSummary._id,
        name: providerStatus.name || providerSummary.name,
        category: providerSummary.category,
        availability: providerStatus.availability,
        reputationStats: {
          responseRate: providerStatus.responseRate || 0,
          responseTimeHours: 1
        },
        schedulingConfig: { slotDurationMinutes: 0 } // use standard date/time
      };
      
      setRebookPrefill({ category, issueDescription, notes });
      setRebookProvider(mockedProvider);
      setIsRebookModalOpen(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/repair/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `repair-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: "Your data has been downloaded." });
      } else {
        toast({ title: "Export Failed", description: "Could not export data.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export Failed", description: "An error occurred during export.", variant: "destructive" });
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

        {/* Quote Requests */}
        {quoteRequests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="h-4 w-4" /> Multi-Quote Requests
            </h4>
            <div className="space-y-2">
              {quoteRequests.map(req => (
                <div 
                  key={req._id} 
                  onClick={() => setSelectedQuoteRequest(req)}
                  className="block group cursor-pointer"
                >
                  <div className={cn("border rounded-md p-3 flex justify-between items-center transition-colors", req.status === 'Open' ? "bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20" : "bg-muted/30 group-hover:bg-muted/60")}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm capitalize">{req.category} Issue</p>
                        {req.quotesReceivedCount > 0 && req.status === 'Open' && (
                          <Badge variant="outline" className="text-[10px] uppercase text-blue-400 border-blue-400/30 bg-blue-400/10 h-5 px-1.5">
                            {req.quotesReceivedCount} New Quotes
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.issueDescription}</p>
                    </div>
                    <Badge variant={
                      req.status === 'Open' ? 'default' : 
                      req.status === 'Completed' ? 'secondary' : 
                      'outline'
                    } className={req.status === 'Open' ? 'bg-blue-600' : ''}>
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
                  <div className={cn("border rounded-md p-3 flex justify-between items-center transition-colors", req.isUrgent ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20" : "bg-muted/30 hover:bg-muted/60")}>
                    <Link to="/repair" className="block group flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm group-hover:underline">{req.providerId?.name || 'Provider no longer available'}</p>
                          {req.isUrgent && (
                            <Badge variant="outline" className="text-[10px] uppercase text-red-500 border-red-500/30 bg-red-500/10 h-5 px-1.5">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{req.providerId?.category || 'Service'}</p>
                        {req.status === 'Pending' && (
                          <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Slot held — pending confirmation
                          </p>
                        )}
                        {!req.isUrgent && req.preferredDate && req.preferredDate !== 'ASAP' && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Scheduled: {new Date(req.preferredDate).toLocaleDateString()} {req.preferredTime !== 'ASAP' ? req.preferredTime : ''}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-2 ml-2">
                      <Badge variant={
                        req.status === 'Accepted' ? 'default' : 
                        req.status === 'In Progress' ? 'secondary' : 
                        'outline'
                      }>
                        {req.status}
                      </Badge>
                      
                      {!req.isUrgent && req.preferredDate && req.preferredDate !== 'ASAP' && req.status !== 'Completed' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1" onClick={(e) => e.stopPropagation()}>
                              <CalendarPlus className="h-3 w-3" /> Sync
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              const title = `Repair: ${req.providerId?.category || 'Service'} with ${req.providerId?.name}`;
                              const desc = req.issueDescription || "Scheduled repair service.";
                              const scheduledAt = new Date(`${req.preferredDate}T${req.preferredTime !== 'ASAP' ? req.preferredTime : '09:00'}`);
                              const duration = 60; // default 1hr
                              const location = "Home"; // assuming home service
                              
                              const ics = generateICS(title, desc, scheduledAt, duration, location);
                              downloadICS(title, ics);
                            }}>
                              Download .ics File
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              const title = encodeURIComponent(`Repair: ${req.providerId?.category || 'Service'}`);
                              const details = encodeURIComponent(req.issueDescription || "Scheduled repair service.");
                              
                              const start = new Date(`${req.preferredDate}T${req.preferredTime !== 'ASAP' ? req.preferredTime : '09:00'}`);
                              const end = new Date(start.getTime() + 60 * 60000);
                              
                              const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                              
                              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${formatDate(start)}/${formatDate(end)}`;
                              window.open(url, '_blank');
                            }}>
                              Add to Google Calendar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Past Requests (Rebook) */}
        {summary.pastRequests && summary.pastRequests.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Past Requests
            </h4>
            <div className="space-y-2">
              {summary.pastRequests.map(req => (
                <div key={req._id} className="border rounded-md p-3 flex justify-between items-center bg-muted/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{req.providerId?.name || 'Provider no longer available'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{req.providerId?.category || 'Service'}</p>
                  </div>
                  {req.providerId && (
                    <Button variant="outline" size="sm" onClick={() => handleRebook(req._id, req.providerId)} className="h-7 text-xs px-2">
                      Rebook
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
      
      {/* Footer / Saved count & Export */}
      <CardFooter className="pt-0 pb-4 flex flex-col gap-2">
        {summary.savedProvidersCount > 0 && (
          <Button variant="ghost" asChild className="w-full justify-between h-auto py-2 text-muted-foreground hover:text-foreground">
            <Link to="/repair?tab=saved">
              <span className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4" /> {summary.savedProvidersCount} Saved Provider{summary.savedProvidersCount !== 1 ? 's' : ''}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={handleExportData} className="w-full justify-between h-auto py-2 text-xs text-muted-foreground hover:text-foreground">
          <span className="flex items-center gap-2">
            Download My Repair Data (GDPR)
          </span>
        </Button>
      </CardFooter>

      <QuoteComparisonSheet 
        quoteRequest={selectedQuoteRequest}
        onClose={() => setSelectedQuoteRequest(null)}
        onRefresh={refreshQuotes}
      />
      
      {rebookProvider && (
        <RequestServiceModal 
          open={isRebookModalOpen} 
          onOpenChange={(open) => {
            setIsRebookModalOpen(open);
            if (!open) {
              setTimeout(() => {
                setRebookProvider(null);
                setRebookPrefill(null);
              }, 300);
            }
          }} 
          provider={rebookProvider as any}
          onSuccess={() => {
            setIsRebookModalOpen(false);
            toast({ title: "Request Sent", description: "Your rebook request has been sent successfully." });
          }}
          prefillData={rebookPrefill}
        />
      )}
    </Card>
  );
};
