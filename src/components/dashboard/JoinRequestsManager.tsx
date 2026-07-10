import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { UserPlus, Check, X, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface JoinRequest {
  id: string;
  idea_id: string;
  team_id: string | null;
  user_id: string;
  message: string | null;
  requested_role: string | null;
  status: string;
  created_at: string;
  idea_title: string;
  applicant_name: string;
}

const roleColors: Record<string, string> = {
  developer: "bg-blue-500/10 text-blue-600",
  designer: "bg-pink-500/10 text-pink-600",
  marketer: "bg-green-500/10 text-green-600",
  analyst: "bg-orange-500/10 text-orange-600",
  researcher: "bg-purple-500/10 text-purple-600",
  co_founder: "bg-accent/10 text-accent-foreground",
};

export const JoinRequestsManager = ({ userId }: { userId: string }) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [ideaIds, setIdeaIds] = useState<string[]>([]);

  const fetchRequests = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dashboard/join-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Tightened subscription: one filter per owned idea_id (Supabase realtime
  // filters only support eq/neq/lt/lte/gt/gte — no `in()`), so we register one
  // postgres_changes filter per idea. RLS already restricts visibility, but
  // narrowing here drops irrelevant broadcasts on the wire. The `ideas` filter
  // refreshes the subscription set when the user creates/deletes ideas.
  useEffect(() => { void fetchRequests(); /* initial load before any realtime */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useRealtimeSync({
    channelName: `dashboard-join-requests-${userId}`,
    filters: [],
    onChange: fetchRequests,
  });

  const handleAccept = async (req: JoinRequest) => {
    setProcessing(req.id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/dashboard/join-requests/${req.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`Accepted ${req.applicant_name} as ${req.requested_role || "developer"}`);
    } catch {
      toast.error("Failed to accept request");
    }
    setProcessing(null);
  };

  const handleReject = async (req: JoinRequest) => {
    setProcessing(req.id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/dashboard/join-requests/${req.id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.info(`Request from ${req.applicant_name} declined`);
    } catch {
      toast.error("Failed to reject request");
    }
    setProcessing(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Join Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Loading...
          </p>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No pending join requests
            </p>
            <Link to="/innovation-hub">
              <Button variant="outline" size="sm" className="gap-1">
                View Ideas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-border/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {req.applicant_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {req.applicant_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        wants to join <span className="font-medium text-foreground">{req.idea_title}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {req.requested_role && (
                      <Badge
                        className={`text-[10px] ${
                          roleColors[req.requested_role] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {req.requested_role.replace("_", " ")}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(req.created_at), {
                        addSuffix: true,
                      })}
                    </Badge>
                  </div>
                </div>

                {req.message && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg italic">
                    "{req.message}"
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(req)}
                    disabled={processing === req.id}
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => handleAccept(req)}
                    disabled={processing === req.id}
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
