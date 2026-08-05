import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarClock, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { RepairRequest, RequestStatus } from "@/types/repair";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";
import { toast } from "@/components/ui/use-toast";

export const RepairRequests = () => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket: Socket | null = null;
    
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/requests`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (result.success) {
          setRequests(result.data);
        }

        // Connect socket for real-time updates
        socket = io(API_URL);
        const userId = JSON.parse(atob(token.split('.')[1])).id; // Extract userId from JWT
        socket.emit('join', userId); // Ensure socket joins user room
        
        socket.on('repair_request:update', (updatedRequest: RepairRequest) => {
          // Map to match frontend structure (e.g., adding providerName)
          const formatted = { ...updatedRequest, id: (updatedRequest as any)._id };
          setRequests(prev => {
            const exists = prev.find(r => r.id === formatted.id);
            if (exists) {
              return prev.map(r => r.id === formatted.id ? { ...r, ...formatted } : r);
            } else {
              return [formatted, ...prev]; // Although unexpected without refresh, just in case
            }
          });
        });

      } catch (error) {
        console.error("Failed to fetch requests", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 bg-yellow-500/10"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "Accepted":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/50 bg-blue-500/10"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="text-purple-500 border-purple-500/50 bg-purple-500/10"><Wrench className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case "Completed":
        return <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "Cancelled":
        return <Badge variant="outline" className="text-red-500 border-red-500/50 bg-red-500/10"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("Are you sure you want to cancel this request?")) {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/requests/${id}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        
        if (result.success) {
          setRequests(requests.map(req => req.id === id ? { ...req, status: "Cancelled" } : req));
          toast({ title: "Request Cancelled", description: "Your service request has been cancelled." });
        } else {
          toast({ title: "Error", description: result.error || "Failed to cancel", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Error cancelling request", variant: "destructive" });
      }
    }
  };

  const handleAddNote = async (id: string) => {
    const note = prompt("Enter your message/note for the provider:");
    if (note && note.trim()) {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/requests/${id}/note`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ note })
        });
        const result = await res.json();
        
        if (result.success) {
          toast({ title: "Note Added", description: "Your message has been added to the request." });
          // Note: the socket will emit 'repair_request:update' and we will pick it up automatically!
        } else {
          toast({ title: "Error", description: result.error || "Failed to add note", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Error adding note", variant: "destructive" });
      }
    }
  };

  const activeRequests = requests.filter(r => ["Pending", "Accepted", "In Progress"].includes(r.status));
  const pastRequests = requests.filter(r => ["Completed", "Cancelled"].includes(r.status));

  const renderRequestCard = (req: RepairRequest) => (
    <Card key={req.id} className="overflow-hidden border-border/50 hover:border-primary/20 transition-all">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">{req.providerName}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Requested on {format(new Date(req.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            {getStatusBadge(req.status)}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-gray-300">{req.issueDescription}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="w-4 h-4 shrink-0" />
              <p>
                Timing: {req.preferredTime === 'ASAP' 
                  ? 'As soon as possible' 
                  : `${format(new Date(req.preferredDate), 'MMM d')} at ${req.preferredTime}`}
              </p>
            </div>
            {req.notes && (
              <div className="mt-2 p-3 bg-secondary/30 rounded-md text-sm whitespace-pre-wrap">
                <span className="font-semibold text-primary">Notes:</span>
                <br />
                {req.notes}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-secondary/20 p-6 flex flex-col justify-center gap-3 sm:w-48 sm:border-l border-border/50">
          <Button variant="outline" className="w-full gap-2 text-sm" size="sm" onClick={() => handleAddNote(req.id)}>
            <MessageSquare className="w-4 h-4" /> Message
          </Button>
          
          {req.status === "Pending" && (
            <Button variant="destructive" className="w-full text-sm" size="sm" onClick={() => handleCancel(req.id)}>
              Cancel Request
            </Button>
          )}
          
          {req.status === "Completed" && (
            <Button variant="default" className="w-full text-sm" size="sm">
              Leave a Review
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Service Requests</h1>
          <p className="text-muted-foreground mt-2">Manage your repair and maintenance bookings.</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "past")}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Requests ({activeRequests.length})</TabsTrigger>
            <TabsTrigger value="past">Past Requests ({pastRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 outline-none">
            {activeRequests.length > 0 ? (
              activeRequests.map(renderRequestCard)
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                No active service requests.
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 outline-none">
            {pastRequests.length > 0 ? (
              pastRequests.map(renderRequestCard)
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                No past service requests.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
export default RepairRequests;
