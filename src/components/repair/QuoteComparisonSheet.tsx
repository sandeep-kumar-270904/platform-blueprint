import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, AlertTriangle, ShieldCheck, MapPin, XCircle, Send } from "lucide-react";
import { QuoteRequest, QuoteResponse } from "@/types/repair";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface QuoteComparisonSheetProps {
  quoteRequest: QuoteRequest | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function QuoteComparisonSheet({ quoteRequest, onClose, onRefresh }: QuoteComparisonSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!quoteRequest) return null;

  const handleAction = async (action: 'cancel' | 'close') => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${API_URL}/api/repair/quotes/${quoteRequest._id}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${action} request`);
      }
      
      toast({ title: "Success", description: `Quote request ${action}ed.` });
      onRefresh();
      if (action === 'cancel') onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${API_URL}/api/repair/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to accept quote");
      }
      
      toast({ title: "Quote Accepted!", description: "Your service request has been confirmed." });
      onRefresh();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const isOpen = quoteRequest.status === 'Open';

  return (
    <Sheet open={!!quoteRequest} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto bg-gray-950 border-l-gray-800 p-0 sm:p-6 flex flex-col">
        <SheetHeader className="p-6 sm:p-0 pb-4 border-b border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px] text-blue-400 border-blue-400/30">
                {quoteRequest.category}
              </Badge>
              <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                Quote Request
                <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-blue-600 hover:bg-blue-600" : ""}>
                  {quoteRequest.status}
                </Badge>
              </SheetTitle>
              <SheetDescription className="text-gray-400 mt-2 line-clamp-2">
                {quoteRequest.issueDescription}
              </SheetDescription>
            </div>
            
            {isOpen && (
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAction('close')} disabled={submitting} className="text-xs">
                  Close (Stop Receiving)
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction('cancel')} disabled={submitting} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30">
                  Cancel Request
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-0 sm:pt-6 space-y-6">
          <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/40 rounded-full text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100">
                  {quoteRequest.quotesReceivedCount} Quotes Received
                </p>
                <p className="text-xs text-blue-300/70">
                  {isOpen ? "Waiting for more responses..." : "Request is no longer accepting new quotes."}
                </p>
              </div>
            </div>
            {isOpen && (
              <Button variant="ghost" size="sm" onClick={onRefresh} className="text-blue-400 hover:text-blue-300">
                Refresh
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Responses</h4>
            
            {!quoteRequest.responses || quoteRequest.responses.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
                <p className="text-muted-foreground text-sm">No quotes received yet.</p>
                <p className="text-xs text-gray-500 mt-1">Providers typically respond within a few hours.</p>
              </div>
            ) : (
              quoteRequest.responses.map(quote => (
                <div key={quote._id} className={cn("bg-gray-900/40 border rounded-xl p-5 relative transition-colors", 
                  quote.status === 'Accepted' ? 'border-green-500/50 bg-green-950/10' : 'border-gray-800/50 hover:border-gray-700'
                )}>
                  {quote.status === 'Accepted' && (
                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] uppercase px-3 py-1 rounded-bl-lg rounded-tr-xl font-bold">
                      Accepted
                    </div>
                  )}
                  {quote.status === 'Rejected' && (
                    <div className="absolute top-0 right-0 bg-gray-800 text-gray-500 text-[10px] uppercase px-3 py-1 rounded-bl-lg rounded-tr-xl font-bold">
                      Not Selected
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link to={`/repair/${quote.providerId._id}`} className="font-semibold text-lg text-white hover:underline">
                        {quote.providerId.name}
                      </Link>
                      <div className="flex items-center space-x-3 mt-1 text-xs">
                        {quote.providerId.reviewsCount > 0 ? (
                          <div className="flex items-center text-yellow-500">
                            <Star className="w-3.5 h-3.5 fill-current mr-1" />
                            <span className="font-medium text-white">{quote.providerId.rating.toFixed(1)}</span>
                            <span className="text-gray-500 ml-1">({quote.providerId.reviewsCount})</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">New Provider</span>
                        )}
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400 capitalize">{quote.providerId.category}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{quote.priceEstimate}</p>
                      <p className="text-xs text-gray-400">Estimated Price</p>
                    </div>
                  </div>

                  <div className="bg-gray-950/50 rounded-lg p-3 mb-4 space-y-2 text-sm border border-gray-800/50">
                    <div className="flex gap-2">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-300 font-medium">Availability: </span>
                        <span className="text-gray-400">{quote.estimatedTimeframe}</span>
                      </div>
                    </div>
                    {quote.note && (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-300 font-medium">Provider Note: </span>
                          <span className="text-gray-400 italic">"{quote.note}"</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {quoteRequest.status === 'Open' && quote.status === 'Pending' && (
                    <Button 
                      className="w-full bg-white text-black hover:bg-gray-200" 
                      onClick={() => handleAcceptQuote(quote._id)}
                      disabled={submitting}
                    >
                      Accept This Quote
                    </Button>
                  )}
                  {quote.status === 'Accepted' && (
                    <Button variant="outline" className="w-full border-green-500/30 text-green-400 bg-green-500/10 cursor-default hover:bg-green-500/10 hover:text-green-400">
                      <ShieldCheck className="w-4 h-4 mr-2" /> Hired for this Job
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
