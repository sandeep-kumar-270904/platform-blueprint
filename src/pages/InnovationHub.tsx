import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lightbulb, Rocket, Heart, MessageSquare, Share2, Sparkles, Trophy, RefreshCw, Loader2 } from "lucide-react";
import { BrainstormRooms } from "@/components/innovation/BrainstormRooms";
import { InnovationLeaderboard } from "@/components/innovation/InnovationLeaderboard";
import { FeedbackCircles } from "@/components/innovation/FeedbackCircles";
import { PostIdeaDialog } from "@/components/innovation/PostIdeaDialog";
import { IdeaDetailDialog } from "@/components/innovation/IdeaDetailDialog";
import { useIdeas } from "@/hooks/useIdeas";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  mvp: "bg-green-500/10 text-green-600",
  launched: "bg-accent/10 text-accent-foreground",
};

const InnovationHub = () => {
  const { user } = useAuth();
  const { ideas, loading, upvoteIdea } = useIdeas();
  const [activeTab, setActiveTab] = useState("ideas");
  const [postOpen, setPostOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const handleUpvote = (id: string) => {
    if (!user) { toast.error("Sign in to upvote"); return; }
    if (likedIds.has(id)) {
      // Already liked — ignore (upvote is a one-way action)
      return;
    }
    setLikedIds(prev => new Set(prev).add(id));
    upvoteIdea(id);
  };

  const handlePost = () => {
    if (!user) { toast.error("Sign in to post ideas"); return; }
    setPostOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-16 md:py-24">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Lightbulb className="mr-1 h-3 w-3" />
                  Innovation & Startups
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Share Your{" "}
                  <span className="text-foreground display-font">
                    Big Ideas
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Connect with fellow innovators, brainstorm in real-time, and bring your startup ideas to life.
                </p>
                <Button size="lg" className="gap-2" onClick={handlePost}>
                  <Rocket className="h-5 w-5" />
                  Post Your Idea
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="ideas" className="gap-2">
              <Lightbulb className="h-4 w-4" /> Ideas
            </TabsTrigger>
            <TabsTrigger value="brainstorm" className="gap-2">
              <Sparkles className="h-4 w-4" /> Brainstorm
            </TabsTrigger>
            <TabsTrigger value="circles" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Circles
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" /> Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ideas">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ideas.length === 0 ? (
              <div className="text-center py-16">
                <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No ideas yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to share your big idea!</p>
                <Button onClick={handlePost} className="gap-2">
                  <Rocket className="h-4 w-4" /> Post Your Idea
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map((idea, index) => {
                  const isLiked = likedIds.has(idea.id);
                  return (
                    <ScrollReveal key={idea.id} delay={0.05 * (index % 6)}>
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {(idea.profile?.username || "U")[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{idea.profile?.username || "Anonymous"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              <Badge className={statusColors[idea.status || "draft"] || statusColors.draft}>
                                {idea.status || "draft"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent
                            className="space-y-3 cursor-pointer"
                            onClick={() => setSelectedIdeaId(idea.id)}
                          >
                            <div>
                              <Badge variant="secondary" className="mb-2">{idea.category}</Badge>
                              <h3 className="font-bold text-lg leading-tight">{idea.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
                            {idea.tags && idea.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {idea.tags.slice(0, 4).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                ))}
                                {idea.tags.length > 4 && (
                                  <Badge variant="outline" className="text-xs">+{idea.tags.length - 4}</Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-3 border-t">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost" size="sm"
                                  className={`gap-1 ${isLiked ? "text-destructive" : ""}`}
                                  onClick={(e) => { e.stopPropagation(); handleUpvote(idea.id); }}
                                >
                                  <motion.div whileTap={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 400 }}>
                                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                                  </motion.div>
                                  <span className="text-xs">{idea.upvotes || 0}</span>
                                </Button>
                                <Button
                                  variant="ghost" size="sm" className="gap-1"
                                  onClick={() => setSelectedIdeaId(idea.id)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/innovation-hub?idea=${idea.id}`);
                                  toast.success("Link copied!");
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="brainstorm">
            <BrainstormRooms />
          </TabsContent>

          <TabsContent value="circles">
            <FeedbackCircles />
          </TabsContent>

          <TabsContent value="leaderboard">
            <InnovationLeaderboard />
          </TabsContent>
        </Tabs>
      </div>

      <PostIdeaDialog open={postOpen} onOpenChange={setPostOpen} />
      <IdeaDetailDialog ideaId={selectedIdeaId} open={!!selectedIdeaId} onOpenChange={(open) => { if (!open) setSelectedIdeaId(null); }} />
    </div>
  );
};

export default InnovationHub;
