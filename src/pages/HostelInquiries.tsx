import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMyInquiries, useOwnerInbox, useRespondInquiry, Inquiry } from "@/hooks/useHostelInquiries";
import { MessageSquare, Calendar, ArrowRight, Loader2, Bed } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const HostelInquiries = () => {
  const { user } = useAuth();
  const { data: sentInquiries, isLoading: loadingSent } = useMyInquiries(user?._id || user?.id);
  const { data: receivedInquiries, isLoading: loadingReceived } = useOwnerInbox(user?._id || user?.id);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-32 max-w-5xl">
        <ScrollReveal>
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Hostel Inquiries</h1>
            <p className="text-muted-foreground">Manage your sent inquiries and incoming booking requests.</p>
          </div>
        </ScrollReveal>

        <Tabs defaultValue="sent" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="sent">My Sent Inquiries</TabsTrigger>
            <TabsTrigger value="received">Owner Inbox</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sent" className="space-y-4">
            {loadingSent ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !sentInquiries || sentInquiries.length === 0 ? (
              <div className="text-center py-20 bg-secondary/20 rounded-xl border border-border/50">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No sent inquiries</h3>
                <p className="text-muted-foreground">You haven't requested any hostel bookings yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sentInquiries.map((inquiry: Inquiry) => (
                  <InquiryCard key={inquiry._id} inquiry={inquiry} isOwnerView={false} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="received" className="space-y-4">
            {loadingReceived ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !receivedInquiries || receivedInquiries.length === 0 ? (
              <div className="text-center py-20 bg-secondary/20 rounded-xl border border-border/50">
                <Bed className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No incoming requests</h3>
                <p className="text-muted-foreground">You haven't received any inquiries for your hostels yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {receivedInquiries.map((inquiry: Inquiry) => (
                  <InquiryCard key={inquiry._id} inquiry={inquiry} isOwnerView={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const InquiryCard = ({ inquiry, isOwnerView }: { inquiry: Inquiry, isOwnerView: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const respondInquiry = useRespondInquiry();
  
  const handleMarkResponded = async () => {
    await respondInquiry.mutateAsync(inquiry._id);
  };
  
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg">
              {isOwnerView ? `Request from ${inquiry.name}` : `Inquiry sent to Hostel`}
            </h3>
            <Badge variant={inquiry.status === 'responded' ? 'default' : 'secondary'} className="capitalize">
              {inquiry.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> 
            Sent on {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Requested Room:</span> <span className="font-medium capitalize">{inquiry.preferredRoomType}</span></p>
          <p><span className="text-muted-foreground">Move-in Date:</span> <span className="font-medium">{format(new Date(inquiry.moveInDate), "MMM d, yyyy")}</span></p>
        </div>
      </div>
      
      {inquiry.message && (
        <div className="bg-secondary/30 rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap border border-border/30">
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-2">Message</span>
          {inquiry.message}
        </div>
      )}
      
      {isOwnerView && inquiry.status === 'sent' && (
        <div className="flex justify-end pt-2 border-t border-border/50 mt-4">
          <Button size="sm" onClick={handleMarkResponded} disabled={respondInquiry.isPending}>
            {respondInquiry.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Mark as Responded
          </Button>
        </div>
      )}
    </div>
  );
};

export default HostelInquiries;
