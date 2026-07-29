import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import {
  Heart, Users, Loader2, Calendar, Tag, MessageSquare, Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IdeaLiveChat } from "./IdeaLiveChat";

interface IdeaDetailProps {
  ideaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IdeaFull {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string | null;
  upvotes: number | null;
  tags: string[] | null;
  created_at: string;
  user_id: string;
  team_id: string | null;
  profile?: { username: string | null; full_name: string | null };
}

export const IdeaDetailDialog = ({ ideaId, open, onOpenChange }: IdeaDetailProps) => {
  const { user } = useAuth();
  const [idea, setIdea] = useState<IdeaFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ user_id: string; role: string; username: string | null }[]>([]);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!ideaId || !open) return;
    setLoading(true);
    setActiveTab("details");
    const fetchIdea = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/innovation/ideas/${ideaId}`);
        if (res.ok) {
          const ideaData = await res.json();
          setIdea(ideaData);
          if (ideaData.team_id) {
            const teamRes = await fetch(`${API_URL}/api/innovation/teams/${ideaData.team_id}/members`);
            if (teamRes.ok) {
              setTeamMembers(await teamRes.json());
            }
          }
        }
      } catch {}
      setLoading(false);
    };
    fetchIdea();

    const interval = setInterval(fetchIdea, 15000);
    return () => clearInterval(interval);
  }, [ideaId, open]);

  const handleUpvote = async () => {
    if (!user || !idea || liked) return;
    setLiked(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/innovation/ideas/${idea.id}/upvote`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-primary/10 text-primary",
    mvp: "bg-green-500/10 text-green-600",
    launched: "bg-accent/10 text-accent-foreground",
  };

  if (!idea && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{idea?.title || "Loading..."}</DialogTitle>
          <DialogDescription className="sr-only">View idea details, team members, and live chat</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : idea ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="gap-1.5">
                <Info className="h-3.5 w-3.5" /> Details
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Live Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[55vh]">
                <div className="space-y-6 pr-4">
                  {/* Author & Meta */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(idea.profile?.username || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{idea.profile?.full_name || idea.profile?.username || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Badge className={statusColors[idea.status || "draft"] || statusColors.draft}>
                        {idea.status || "draft"}
                      </Badge>
                      <Badge variant="secondary">{idea.category}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>

                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {idea.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs gap-1">
                          <Tag className="h-2.5 w-2.5" /> {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      variant={liked ? "default" : "outline"}
                      size="sm" className="gap-1.5"
                      onClick={handleUpvote}
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                      {idea.upvotes || 0} Upvotes
                    </Button>
                  </div>

                  <Separator />

                  {teamMembers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Team ({teamMembers.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {teamMembers.map(m => (
                          <div key={m.user_id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {(m.username || "U")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{m.username || "User"}</span>
                            <Badge variant="outline" className="text-[10px] py-0">{m.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 min-h-0 mt-4">
              <IdeaLiveChat ideaId={idea.id} />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
