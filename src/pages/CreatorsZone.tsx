import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sparkles, Upload, Video, FileText, Image as ImageIcon, TrendingUp, 
  Eye, Heart, MessageSquare, Edit, Trash2, Plus, ExternalLink, 
  Loader2, AlertCircle, CheckCircle2, Code, BookOpen, Layers, Clock, AlertTriangle 
} from "lucide-react";
import { 
  useCreatorFeed, 
  useMyCreatorContent, 
  useCreateCreatorContent, 
  useUpdateCreatorContent, 
  useDeleteCreatorContent, 
  useLikeCreatorContent, 
  useViewCreatorContent,
  useSeedCreatorContent,
  CreatorContentItem 
} from "@/hooks/useCreators";

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-3.5 w-3.5 mr-1" />,
  video: <Video className="h-3.5 w-3.5 mr-1" />,
  project: <Code className="h-3.5 w-3.5 mr-1" />,
  resource: <BookOpen className="h-3.5 w-3.5 mr-1" />
};

const typeColors: Record<string, string> = {
  article: "bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800",
  video: "bg-purple-500/10 text-purple-500 border-purple-200 dark:border-purple-800",
  project: "bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-800",
  resource: "bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800"
};

const CreatorsZone: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("browse");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreatorContentItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<'article' | 'video' | 'project' | 'resource'>("article");
  const [formDescription, setFormDescription] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("✨");
  const [formTags, setFormTags] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ title?: string; body?: string }>({});

  // Detail view state
  const [viewingItem, setViewingItem] = useState<CreatorContentItem | null>(null);

  // Queries & Mutations
  const { data: feedItems, isLoading: feedLoading, isError: feedError, refetch: refetchFeed } = useCreatorFeed(selectedFilter, searchQuery);
  const { data: myItems, isLoading: myLoading, isError: myError, refetch: refetchMy } = useMyCreatorContent(selectedFilter);

  const createMutation = useCreateCreatorContent();
  const updateMutation = useUpdateCreatorContent();
  const deleteMutation = useDeleteCreatorContent();
  const likeMutation = useLikeCreatorContent();
  const viewMutation = useViewCreatorContent();
  const seedMutation = useSeedCreatorContent();

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormType("article");
    setFormDescription("");
    setFormBody("");
    setFormThumbnail("✨");
    setFormTags("");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.type);
    setFormDescription(item.description || "");
    setFormBody(item.body || "");
    setFormThumbnail(item.thumbnail || "✨");
    setFormTags(item.tags?.join(", ") || "");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    // Inline validation required before allowing save/publish
    const errors: { title?: string; body?: string } = {};
    if (!formTitle.trim()) {
      errors.title = "Title is required to publish or save.";
    }
    if (!formBody.trim()) {
      errors.body = "Content body or link URL is required.";
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please check the highlighted fields before submitting.",
        variant: "destructive"
      });
      return;
    }
    setValidationErrors({});

    const tagsArray = formTags.split(",").map(t => t.trim()).filter(Boolean);
    const payload = {
      title: formTitle.trim(),
      type: formType,
      description: formDescription.trim() || formBody.trim().substring(0, 150),
      body: formBody.trim(),
      thumbnail: formThumbnail || "✨",
      status,
      tags: tagsArray
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem._id, data: payload });
        toast({
          title: status === 'published' ? "Content Published!" : "Draft Saved!",
          description: `"${payload.title}" has been updated successfully.`
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: status === 'published' ? "Content Published!" : "Draft Created!",
          description: `"${payload.title}" is now available in your creator portfolio.`
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err?.response?.data?.message || "An error occurred while saving.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(item._id);
      toast({ title: "Deleted Successfully", description: "The content piece has been removed." });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleLike = async (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to like content.", variant: "destructive" });
      return;
    }
    try {
      await likeMutation.mutateAsync(item._id);
    } catch (err: any) {
      toast({ title: "Error", description: "Could not record like.", variant: "destructive" });
    }
  };

  const handleCardClick = (item: CreatorContentItem) => {
    setViewingItem(item);
    viewMutation.mutate(item._id);
  };

  const handleSeedDemo = async () => {
    try {
      await seedMutation.mutateAsync();
      toast({ title: "Demo Feed Generated!", description: "4 realistic creator items have been added to the feed." });
    } catch (err: any) {
      toast({ title: "Seed Failed", description: err.message, variant: "destructive" });
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const renderContentCards = (items: CreatorContentItem[] | undefined, isMyContentView: boolean) => {
    if (!items || items.length === 0) {
      return (
        <Card className="max-w-xl mx-auto border-dashed border-2 py-12 px-6 text-center bg-muted/10">
          <CardContent className="space-y-4 pt-0">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Upload className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">
              {isMyContentView ? "No content created yet" : "No creators content found"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {isMyContentView 
                ? "You haven't uploaded any content pieces yet. Start sharing your tutorials, videos, or projects to build your audience." 
                : "The creator feed is currently empty. Be the first creator to publish knowledge on the platform!"}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button onClick={openCreateModal} className="font-semibold shadow-sm">
                <Upload className="mr-2 h-4 w-4" />
                {isMyContentView ? "Upload Your First Content" : "Upload Content"}
              </Button>
              {!isMyContentView && (
                <Button variant="outline" onClick={handleSeedDemo} disabled={seedMutation.isPending}>
                  {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-amber-500" />}
                  Generate Demo Feed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => {
          const isLiked = user && item.likedBy && item.likedBy.includes(user._id || user.id);
          return (
            <ScrollReveal key={item._id} delay={0.05 * (index % 6)}>
              <Card 
                onClick={() => handleCardClick(item)} 
                className="group hover-lift cursor-pointer overflow-hidden border border-border/60 hover:border-primary/50 transition-all duration-300 flex flex-col h-full bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/10 via-muted/30 to-background border-b border-border/30 flex items-center justify-center text-6xl relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                  <span className="select-none filter drop-shadow-sm">{item.thumbnail || "✨"}</span>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="outline" className={`font-medium backdrop-blur-md px-2 py-0.5 ${typeColors[item.type] || "bg-secondary"}`}>
                      {typeIcons[item.type]}
                      <span className="capitalize">{item.type}</span>
                    </Badge>
                  </div>
                  {isMyContentView && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'} className="text-xs backdrop-blur-md">
                        {item.status === 'published' ? <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" /> : <Clock className="h-3 w-3 mr-1 text-amber-400" />}
                        <span className="capitalize">{item.status}</span>
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="p-5 pb-3 flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                        {item.creatorName ? item.creatorName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span className="font-medium text-foreground/80 truncate max-w-[120px]">{item.creatorName}</span>
                    </div>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description || item.body}
                  </p>
                </CardHeader>

                <CardFooter className="p-5 pt-3 border-t border-border/40 bg-muted/20 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Views">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{item.views?.toLocaleString() || 0}</span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(item, e)}
                      className={`flex items-center gap-1 hover:text-red-500 transition-colors py-1 px-1.5 rounded -ml-1.5 ${isLiked ? 'text-red-500 font-semibold' : ''}`}
                      title="Like"
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{item.likes?.toLocaleString() || 0}</span>
                    </button>
                    <div className="flex items-center gap-1" title="Comments">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{item.commentsCount || 0}</span>
                    </div>
                  </div>

                  {isMyContentView && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => openEditModal(item, e)}
                        className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                        title="Edit Content"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleDelete(item, e)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                        title="Delete Content"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.2}>
        <section className="relative overflow-hidden py-10 md:py-16 border-b border-border/40 bg-gradient-to-b from-muted/30 via-background to-background">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-3 px-3 py-1 text-xs shadow-sm">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300 animate-pulse" />
                  Creator Knowledge Hub
                </Badge>
                <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Creators{" "}
                  <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Zone
                  </span>
                </h1>
                <p className="mx-auto mb-6 max-w-2xl text-base md:text-lg text-muted-foreground">
                  Share your tutorials, video courses, open-source projects, and design resources. Build your audience and showcase your expertise.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button size="lg" onClick={openCreateModal} className="rounded-full shadow-md hover:shadow-lg transition-all font-semibold">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Content
                  </Button>
                  {feedItems && feedItems.length === 0 && (
                    <Button size="lg" variant="outline" onClick={handleSeedDemo} disabled={seedMutation.isPending} className="rounded-full">
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      Seed Demo Data
                    </Button>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-3 bg-muted/60 p-1 rounded-full border border-border/40">
              <TabsTrigger value="browse" className="rounded-full px-6 py-1.5 font-medium">Browse Feed</TabsTrigger>
              <TabsTrigger value="mycontent" className="rounded-full px-6 py-1.5 font-medium">My Content</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-full px-6 py-1.5 font-medium">Analytics</TabsTrigger>
            </TabsList>

            {selectedTab !== "analytics" && (
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 text-xs font-medium">
                  <button 
                    onClick={() => setSelectedFilter("all")} 
                    className={`px-3 py-1 rounded-md transition-colors ${selectedFilter === "all" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setSelectedFilter("article")} 
                    className={`px-3 py-1 rounded-md transition-colors ${selectedFilter === "article" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Articles
                  </button>
                  <button 
                    onClick={() => setSelectedFilter("video")} 
                    className={`px-3 py-1 rounded-md transition-colors ${selectedFilter === "video" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Videos
                  </button>
                  <button 
                    onClick={() => setSelectedFilter("project")} 
                    className={`px-3 py-1 rounded-md transition-colors ${selectedFilter === "project" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Projects
                  </button>
                  <button 
                    onClick={() => setSelectedFilter("resource")} 
                    className={`px-3 py-1 rounded-md transition-colors ${selectedFilter === "resource" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Resources
                  </button>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="browse" className="space-y-6 pt-2">
            {feedLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Loading creator feed...</p>
              </div>
            ) : feedError ? (
              <Card className="max-w-md mx-auto py-8 text-center border-destructive/30 bg-destructive/5">
                <CardContent className="space-y-3">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                  <h3 className="font-bold text-lg">Failed to load feed</h3>
                  <p className="text-sm text-muted-foreground">Could not reach the backend server.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchFeed()}>Retry</Button>
                </CardContent>
              </Card>
            ) : (
              renderContentCards(feedItems, false)
            )}
          </TabsContent>

          <TabsContent value="mycontent" className="space-y-6 pt-2">
            {myLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Loading your content...</p>
              </div>
            ) : myError ? (
              <Card className="max-w-md mx-auto py-8 text-center border-destructive/30 bg-destructive/5">
                <CardContent className="space-y-3">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                  <h3 className="font-bold text-lg">Failed to load your content</h3>
                  <p className="text-sm text-muted-foreground">Please ensure you are signed in.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchMy()}>Retry</Button>
                </CardContent>
              </Card>
            ) : (
              renderContentCards(myItems, true)
            )}
          </TabsContent>

          <TabsContent value="analytics" className="pt-4">
            <Card className="max-w-3xl mx-auto border border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">Creator Analytics Dashboard</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed performance tracking, engagement curves, and audience demographics will be available in a future phase.
                </p>
              </CardHeader>
              <CardContent className="py-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-background/80 border border-border/50 text-center p-6">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-3xl font-extrabold mb-1">
                      {myItems ? myItems.reduce((acc, item) => acc + (item.views || 0), 0).toLocaleString() : 0}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Views</p>
                  </Card>
                  <Card className="bg-background/80 border border-border/50 text-center p-6">
                    <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <p className="text-3xl font-extrabold mb-1">
                      {myItems ? myItems.reduce((acc, item) => acc + (item.likes || 0), 0).toLocaleString() : 0}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Likes</p>
                  </Card>
                  <Card className="bg-background/80 border border-border/50 text-center p-6">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-extrabold mb-1">{myItems?.length || 0}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Published Pieces</p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {editingItem ? "Edit Content Piece" : "Upload New Content"}
            </DialogTitle>
            <DialogDescription>
              Share your knowledge with fellow students. Choose whether to save as a draft or publish live immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Content Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['article', 'video', 'project', 'resource'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormType(type)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium capitalize transition-all ${formType === type ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border/60 hover:bg-muted/50 text-muted-foreground'}`}
                  >
                    {typeIcons[type]}
                    <span className="mt-1">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Complete Guide to React Server Components"
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  if (validationErrors.title) setValidationErrors({ ...validationErrors, title: undefined });
                }}
                className={validationErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {validationErrors.title && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" /> {validationErrors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Icon / Emoji
                </label>
                <Input
                  className="text-center text-xl h-10"
                  value={formThumbnail}
                  onChange={(e) => setFormThumbnail(e.target.value)}
                  placeholder="✨"
                  maxLength={4}
                />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Tags (comma-separated)
                </label>
                <Input
                  placeholder="e.g. React, WebDev, UIUX"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Short Excerpt / Description
              </label>
              <Input
                placeholder="Brief summary that appears on the feed card..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Content Body or Media URL <span className="text-destructive">*</span>
              </label>
              <Textarea
                rows={5}
                placeholder={formType === 'video' ? "Paste video URL (YouTube/Vimeo) and description..." : formType === 'project' ? "Paste GitHub repository URL or project overview..." : "Write your article or tutorial content..."}
                value={formBody}
                onChange={(e) => {
                  setFormBody(e.target.value);
                  if (validationErrors.body) setValidationErrors({ ...validationErrors, body: undefined });
                }}
                className={validationErrors.body ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {validationErrors.body && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" /> {validationErrors.body}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSave('published')}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto font-semibold"
            >
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {editingItem && editingItem.status === 'published' ? "Update Published" : "Publish Live"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Viewer Modal */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        {viewingItem && (
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`font-medium ${typeColors[viewingItem.type]}`}>
                  {typeIcons[viewingItem.type]}
                  <span className="capitalize">{viewingItem.type}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">• {formatDate(viewingItem.createdAt)}</span>
              </div>
              <DialogTitle className="text-2xl font-bold leading-tight">{viewingItem.title}</DialogTitle>
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground border-b border-border/40 pb-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                  {viewingItem.creatorName ? viewingItem.creatorName.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="font-medium text-foreground">{viewingItem.creatorName}</span>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4 text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {viewingItem.description && viewingItem.description !== viewingItem.body && (
                <p className="font-medium text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40 italic">
                  {viewingItem.description}
                </p>
              )}
              <div className="pt-2">
                {viewingItem.body}
              </div>
            </div>

            {viewingItem.tags && viewingItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                {viewingItem.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border/40 pt-4 mt-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>{viewingItem.views?.toLocaleString() || 0} views</span>
                </div>
                <button 
                  onClick={(e) => handleLike(viewingItem, e)}
                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                >
                  <Heart className={`h-4 w-4 ${user && viewingItem.likedBy && viewingItem.likedBy.includes(user._id || user.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{viewingItem.likes?.toLocaleString() || 0} likes</span>
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default CreatorsZone;
