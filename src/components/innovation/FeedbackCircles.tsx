import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Calendar, Star, MessageSquare, ChevronRight, UserPlus, Loader2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAuth } from "@/hooks/useAuth";

interface CircleMember {
  user_id: string;
  project_name: string | null;
  skills: string[];
  profile?: { username: string | null; avatar_url: string | null };
}

interface FeedbackCircleRow {
  id: string;
  name: string;
  topic: string;
  meeting_time: string | null;
  week_number: number;
  status: string;
  created_by: string | null;
  created_at: string;
}

interface FeedbackCircle extends FeedbackCircleRow {
  members: CircleMember[];
  feedbackGiven: number;
  feedbackTotal: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; color: string }> = {
  active: { label: "Active Now", variant: "default", color: "bg-green-500" },
  upcoming: { label: "Upcoming", variant: "secondary", color: "bg-blue-500" },
  completed: { label: "Completed", variant: "outline", color: "bg-muted-foreground" },
};

export const FeedbackCircles = () => {
  const { user } = useAuth();
  const [circles, setCircles] = useState<FeedbackCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircle, setSelectedCircle] = useState<FeedbackCircle | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<CircleMember | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCircle, setNewCircle] = useState({ name: "", topic: "", meeting_time: "", status: "upcoming" });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchCircles = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/innovation/feedback-circles`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCircles(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCircles();
    const interval = setInterval(fetchCircles, 15000);
    return () => clearInterval(interval);
  }, [fetchCircles]);

  // Keep selectedCircle in sync with updated data
  useEffect(() => {
    if (selectedCircle) {
      const updated = circles.find(c => c.id === selectedCircle.id);
      if (updated) setSelectedCircle(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circles]);

  const handleJoinCircle = async () => {
    if (!user) { toast.error("Sign in to join a circle"); return; }
    if (joining) return;

    const joinable = circles.find(c =>
      c.status !== "completed" && !c.members.some(m => m.user_id === user.id)
    );

    if (!joinable) {
      toast.info("No open circles to join right now. Create one or check back later!");
      return;
    }

    setJoining(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/feedback-circles/${joinable.id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Joined "${joinable.name}"!`);
        fetchCircles();
      } else {
        const data = await res.json();
        if (data.message?.includes("already")) toast.info("You're already in this circle!");
        else toast.error("Failed to join circle");
      }
    } catch {
      toast.error("Failed to join circle");
    }
    setJoining(false);
  };

  const handleCreateCircle = async () => {
    if (!user) { toast.error("Sign in to create a circle"); return; }
    if (!newCircle.name.trim() || !newCircle.topic.trim()) {
      toast.error("Name and topic are required");
      return;
    }
    setCreating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/feedback-circles`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCircle.name.trim(),
          topic: newCircle.topic.trim(),
          meeting_time: newCircle.meeting_time.trim() || null,
          status: newCircle.status,
        })
      });
      if (res.ok) {
        toast.success("Circle created!");
        setCreateOpen(false);
        setNewCircle({ name: "", topic: "", meeting_time: "", status: "upcoming" });
        fetchCircles();
      } else {
        toast.error("Failed to create circle");
      }
    } catch {
      toast.error("Failed to create circle");
    }
    setCreating(false);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !feedbackTarget || !selectedCircle || !user || submittingFeedback) return;

    setSubmittingFeedback(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/feedback-circles/${selectedCircle.id}/feedback`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user_id: feedbackTarget.user_id,
          content: feedbackText.trim(),
          rating: feedbackRating,
        })
      });
      if (res.ok) {
        toast.success(`Feedback sent to ${feedbackTarget.profile?.username || "member"}!`);
        setFeedbackText("");
        setFeedbackRating(4);
        setFeedbackDialogOpen(false);
        setFeedbackTarget(null);
        fetchCircles();
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch {
      toast.error("Failed to submit feedback");
    }
    setSubmittingFeedback(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-primary" />
            Feedback Circles
          </h2>
          <p className="text-muted-foreground">Get matched with 4-6 peers weekly for structured project feedback</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleJoinCircle} variant="outline" className="gap-2" disabled={joining}>
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Join Next Circle
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Circle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Feedback Circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Circle Name *</label>
                  <Input
                    placeholder="e.g. Innovation Circle D"
                    value={newCircle.name}
                    onChange={(e) => setNewCircle(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic *</label>
                  <Input
                    placeholder="e.g. MVP Validation"
                    value={newCircle.topic}
                    onChange={(e) => setNewCircle(prev => ({ ...prev, topic: e.target.value }))}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meeting Time</label>
                  <Input
                    placeholder="e.g. Wed 6:00 PM"
                    value={newCircle.meeting_time}
                    onChange={(e) => setNewCircle(prev => ({ ...prev, meeting_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newCircle.status} onValueChange={(val) => setNewCircle(prev => ({ ...prev, status: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateCircle} className="w-full" disabled={creating || !newCircle.name.trim() || !newCircle.topic.trim()}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Circle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* How it Works */}
      <Card className="bg-primary text-primary-foreground border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">How Feedback Circles Work</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Get Matched", desc: "Matched with 4-6 peers every Monday" },
              { step: "2", title: "Share Progress", desc: "Present your project updates" },
              { step: "3", title: "Give Feedback", desc: "Provide structured feedback to peers" },
              { step: "4", title: "Improve", desc: "Apply insights to your project" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {item.step}
                </div>
                <h4 className="text-sm font-semibold">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading / Empty / Circles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : circles.length === 0 ? (
        <div className="text-center py-16">
          <RefreshCw className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No circles yet</h3>
          <p className="text-muted-foreground mb-6">Feedback circles will appear here once created.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle, i) => {
            const config = statusConfig[circle.status] || statusConfig.upcoming;
            return (
              <ScrollReveal key={circle.id} delay={i * 0.1}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedCircle?.id === circle.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedCircle(circle)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{circle.name}</CardTitle>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Week {circle.week_number} {circle.meeting_time ? `• ${circle.meeting_time}` : ""}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">This week's topic</p>
                      <Badge variant="outline">{circle.topic}</Badge>
                    </div>

                    {/* Members */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Members ({circle.members.length})</p>
                      <div className="flex -space-x-2">
                        {circle.members.map((member, j) => (
                          <Avatar key={j} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {(member.profile?.username || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Feedback Progress</span>
                        <span className="font-medium">{circle.feedbackGiven}/{circle.feedbackTotal}</span>
                      </div>
                      <Progress value={circle.feedbackTotal > 0 ? (circle.feedbackGiven / circle.feedbackTotal) * 100 : 0} className="h-1.5" />
                    </div>

                    <Button variant="outline" size="sm" className="w-full gap-1">
                      View Details <ChevronRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* Selected Circle Detail */}
      <AnimatePresence>
        {selectedCircle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCircle.name} — Members</CardTitle>
                  <Badge variant={(statusConfig[selectedCircle.status] || statusConfig.upcoming).variant}>
                    {(statusConfig[selectedCircle.status] || statusConfig.upcoming).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {selectedCircle.members.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No members in this circle yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCircle.members.map((member, i) => (
                      <motion.div
                        key={member.user_id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {(member.profile?.username || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">{member.profile?.username || "Anonymous"}</h4>
                                <p className="text-xs text-muted-foreground">{member.project_name || "No project"}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {member.skills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                                  ))}
                                </div>
                                {user && member.user_id !== user.id && (
                                  <div className="flex gap-2 mt-3">
                                    <Dialog open={feedbackDialogOpen && feedbackTarget?.user_id === member.user_id} onOpenChange={(open) => {
                                      setFeedbackDialogOpen(open);
                                      if (!open) setFeedbackTarget(null);
                                    }}>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs gap-1 h-6"
                                          onClick={() => setFeedbackTarget(member)}
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          Give Feedback
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Feedback for {member.profile?.username || "Member"}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-2">
                                          <div className="p-3 bg-muted/50 rounded-lg">
                                            <p className="text-sm font-medium">Project: {member.project_name || "N/A"}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Topic: {selectedCircle.topic}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium">Your Feedback</label>
                                            <Textarea
                                              placeholder="Share constructive feedback on their project..."
                                              value={feedbackText}
                                              onChange={(e) => setFeedbackText(e.target.value)}
                                              rows={5}
                                              maxLength={2000}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium">Rating</label>
                                            <div className="flex gap-1">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Button
                                                  key={star}
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => setFeedbackRating(star)}
                                                >
                                                  <Star className={`h-4 w-4 ${star <= feedbackRating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                                                </Button>
                                              ))}
                                            </div>
                                          </div>
                                          <Button onClick={handleSubmitFeedback} className="w-full" disabled={!feedbackText.trim() || submittingFeedback}>
                                            {submittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Submit Feedback
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
