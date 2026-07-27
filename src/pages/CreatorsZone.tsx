import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import useDebounce from "@/hooks/useDebounce";
import { 
  Sparkles, Upload, Video, FileText, Image as ImageIcon, TrendingUp, 
  Eye, Heart, MessageSquare, Edit, Trash2, Plus, ExternalLink, 
  Loader2, AlertCircle, CheckCircle2, Code, BookOpen, Clock, AlertTriangle, 
  Search, Filter, X, Tag, Send, Play, EyeOff, Share2, ArrowLeft, Check
} from "lucide-react";
import { 
  useCreatorFeed, 
  useMyCreatorContent, 
  useCreateCreatorContent, 
  useUpdateCreatorContent, 
  useDeleteCreatorContent, 
  useLikeCreatorContent, 
  useViewCreatorContent,
  useCommentCreatorContent,
  useSeedCreatorContent,
  CreatorContentItem,
  CommentItem
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

const POPULAR_TAGS = ["DSA", "Web Dev", "Career Advice", "Design", "AI", "React", "Python", "UIUX", "SystemDesign", "OpenSource"];

// Helper to render YouTube/Vimeo or Images safely
const MediaEmbedViewer: React.FC<{ url?: string; title?: string }> = ({ url, title }) => {
  const [hasError, setHasError] = useState(false);
  if (!url || !url.trim()) return null;
  const cleanUrl = url.trim();

  if (hasError) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-center gap-2 my-3">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span>Media preview unavailable or invalid URL ({cleanUrl.substring(0, 40)}...)</span>
      </div>
    );
  }

  // Check YouTube
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <div className="my-4 rounded-xl overflow-hidden shadow-md border border-border/60 aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title={title || "YouTube video player"}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // Check Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return (
      <div className="my-4 rounded-xl overflow-hidden shadow-md border border-border/60 aspect-video bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[3]}`}
          title={title || "Vimeo video player"}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // Check Image
  if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(?:\?.*)?$/i) || cleanUrl.startsWith("data:image/") || cleanUrl.startsWith("http")) {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-border/60 max-h-[450px] bg-muted/20 flex items-center justify-center">
        <img 
          src={cleanUrl} 
          alt={title || "Content attachment"} 
          onError={() => setHasError(true)}
          className="max-h-[450px] w-auto object-contain mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="p-3 bg-muted/20 rounded-lg border border-border/40 text-xs text-muted-foreground flex items-center justify-between my-3">
      <div className="flex items-center gap-2 truncate">
        <ExternalLink className="h-4 w-4 text-primary shrink-0" />
        <span className="truncate">{cleanUrl}</span>
      </div>
      <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline shrink-0 ml-2">
        Open Link →
      </a>
    </div>
  );
};

// Helper to format text with code blocks
const FormattedBodyRenderer: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;

  // Simple parser for markdown-style code blocks ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3 leading-relaxed text-foreground/90 whitespace-pre-wrap font-normal">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const content = part.slice(3, -3);
          const firstLineEnd = content.indexOf("\n");
          const lang = firstLineEnd > -1 ? content.slice(0, firstLineEnd).trim() : "";
          const code = firstLineEnd > -1 ? content.slice(firstLineEnd + 1) : content;
          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 shadow-sm font-mono text-xs">
              {lang && (
                <div className="bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-800 flex items-center justify-between">
                  <span>{lang.toUpperCase()}</span>
                  <Code className="h-3 w-3 text-slate-500" />
                </div>
              )}
              <pre className="p-3.5 overflow-x-auto leading-normal">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

const CreatorsZone: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state persistence
  const selectedTab = searchParams.get("tab") || "browse";
  const selectedFilter = searchParams.get("type") || "all";
  const selectedTag = searchParams.get("tag") || "all";
  const sortBy = searchParams.get("sort") || "recent";
  const searchQuery = searchParams.get("q") || "";

  // Local search input for smooth typing
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      updateParam("q", debouncedSearch);
    }
  }, [debouncedSearch]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "recent" || (key === "tab" && value === "browse")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const resetAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("type");
    next.delete("tag");
    next.delete("sort");
    next.delete("q");
    setSearchInput("");
    setSearchParams(next, { replace: true });
  };

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'preview'>("edit");
  const [editingItem, setEditingItem] = useState<CreatorContentItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<'article' | 'video' | 'project' | 'resource'>("article");
  const [formDescription, setFormDescription] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("✨");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ title?: string; body?: string }>({});

  // Detail view state & comments
  const [viewingItem, setViewingItem] = useState<CreatorContentItem | null>(null);
  const [commentText, setCommentText] = useState("");

  // Queries & Mutations with search, sort & tag
  const { data: feedItems, isLoading: feedLoading, isError: feedError, refetch: refetchFeed } = useCreatorFeed(selectedFilter, searchQuery, sortBy, selectedTag);
  const { data: myItems, isLoading: myLoading, isError: myError, refetch: refetchMy } = useMyCreatorContent(selectedFilter, searchQuery, sortBy, selectedTag);

  const createMutation = useCreateCreatorContent();
  const updateMutation = useUpdateCreatorContent();
  const deleteMutation = useDeleteCreatorContent();
  const likeMutation = useLikeCreatorContent();
  const viewMutation = useViewCreatorContent();
  const commentMutation = useCommentCreatorContent();
  const seedMutation = useSeedCreatorContent();

  const openCreateModal = () => {
    setEditingItem(null);
    setModalMode("edit");
    setFormTitle("");
    setFormType("article");
    setFormDescription("");
    setFormBody("");
    setFormThumbnail("✨");
    setFormMediaUrl("");
    setFormTags("");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setModalMode("edit");
    setFormTitle(item.title);
    setFormType(item.type);
    setFormDescription(item.description || "");
    setFormBody(item.body || "");
    setFormThumbnail(item.thumbnail || "✨");
    setFormMediaUrl(item.mediaUrl || "");
    setFormTags(item.tags?.join(", ") || "");
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleTagChipToggle = (tag: string) => {
    const current = formTags.split(",").map(t => t.trim()).filter(Boolean);
    if (current.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
      setFormTags(current.filter(t => t.toLowerCase() !== tag.toLowerCase()).join(", "));
    } else {
      setFormTags(current.length > 0 ? `${current.join(", ")}, ${tag}` : tag);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    const errors: { title?: string; body?: string } = {};
    if (!formTitle.trim()) {
      errors.title = "Title is required to publish or save.";
    }
    if (!formBody.trim()) {
      errors.body = "Content body or link URL is required.";
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setModalMode("edit");
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
      mediaUrl: formMediaUrl.trim(),
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
      if (viewingItem && viewingItem._id === item._id) setViewingItem(null);
      toast({ title: "Deleted Successfully", description: "The content piece has been removed." });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleLike = async (item: CreatorContentItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to like content.", variant: "destructive" });
      return;
    }
    try {
      const res = await likeMutation.mutateAsync(item._id);
      if (viewingItem && viewingItem._id === item._id) {
        const isLiked = viewingItem.likedBy && viewingItem.likedBy.includes(user._id || user.id);
        const nextLikedBy = isLiked 
          ? viewingItem.likedBy.filter(id => id !== (user._id || user.id))
          : [...(viewingItem.likedBy || []), (user._id || user.id)];
        setViewingItem({
          ...viewingItem,
          likes: res.likes !== undefined ? res.likes : (isLiked ? Math.max(0, viewingItem.likes - 1) : viewingItem.likes + 1),
          likedBy: nextLikedBy
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Could not record like.", variant: "destructive" });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to leave a comment.", variant: "destructive" });
      return;
    }
    if (!commentText.trim()) return;
    if (!viewingItem) return;

    try {
      const updated = await commentMutation.mutateAsync({ id: viewingItem._id, text: commentText });
      setCommentText("");
      setViewingItem(updated);
      toast({ title: "Comment Posted!", description: "Your comment is live." });
    } catch (err: any) {
      toast({ title: "Comment Failed", description: err.message || "Could not post comment.", variant: "destructive" });
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const activeFilterCount = (selectedFilter !== "all" ? 1 : 0) + (selectedTag !== "all" ? 1 : 0) + (sortBy !== "recent" ? 1 : 0) + (searchQuery ? 1 : 0);
  const currentItems = selectedTab === "mycontent" ? myItems : feedItems;

  const renderContentCards = (items: CreatorContentItem[] | undefined, isMyContentView: boolean) => {
    if (!items || items.length === 0) {
      if (activeFilterCount > 0) {
        return (
          <Card className="max-w-md mx-auto border-dashed border-2 py-12 px-6 text-center bg-muted/10">
            <CardContent className="space-y-4 pt-0">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">No matching results</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                We couldn't find any creator items matching your active search, tags, or filters.
              </p>
              <Button onClick={resetAllFilters} variant="outline" className="font-semibold shadow-sm mt-2">
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        );
      }

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
          const authorName = typeof item.userId === 'object' ? item.userId?.name : item.creatorName;
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
                        {authorName ? authorName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span className="font-medium text-foreground/80 truncate max-w-[120px]">{authorName}</span>
                    </div>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description || item.body}
                  </p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {item.tags.slice(0, 3).map((t, i) => (
                        <span 
                          key={i} 
                          onClick={(e) => { e.stopPropagation(); updateParam("tag", t); }}
                          className="inline-flex items-center text-[10px] bg-muted/60 hover:bg-primary/15 hover:text-primary px-2 py-0.5 rounded-full font-medium text-muted-foreground transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground self-center pl-0.5">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
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
                      <span>{item.commentsCount || (item.comments ? item.comments.length : 0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                      Read more →
                    </span>
                    {isMyContentView && (
                      <div className="flex items-center gap-1 ml-2 border-l border-border/60 pl-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => openEditModal(item, e)}
                          className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                          title="Edit Content"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleDelete(item, e)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Content"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
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
        <Tabs value={selectedTab} onValueChange={(val) => updateParam("tab", val)} className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-3 bg-muted/60 p-1 rounded-full border border-border/40">
              <TabsTrigger value="browse" className="rounded-full px-6 py-1.5 font-medium">Browse Feed</TabsTrigger>
              <TabsTrigger value="mycontent" className="rounded-full px-6 py-1.5 font-medium">My Content</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-full px-6 py-1.5 font-medium">Analytics</TabsTrigger>
            </TabsList>

            {selectedTab !== "analytics" && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search titles, descriptions..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs rounded-full bg-muted/30 border-border/60 focus:bg-background transition-colors"
                  />
                  {searchInput && (
                    <button 
                      onClick={() => { setSearchInput(""); updateParam("q", ""); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 text-xs font-medium overflow-x-auto max-w-full">
                  <button 
                    onClick={() => updateParam("type", "all")} 
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${selectedFilter === "all" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    All Types
                  </button>
                  <button 
                    onClick={() => updateParam("type", "article")} 
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${selectedFilter === "article" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Articles
                  </button>
                  <button 
                    onClick={() => updateParam("type", "video")} 
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${selectedFilter === "video" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Videos
                  </button>
                  <button 
                    onClick={() => updateParam("type", "project")} 
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${selectedFilter === "project" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Projects
                  </button>
                  <button 
                    onClick={() => updateParam("type", "resource")} 
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${selectedFilter === "resource" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Resources
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 text-xs font-medium shrink-0">
                  <button 
                    onClick={() => updateParam("sort", "recent")} 
                    className={`px-2.5 py-1 rounded-md transition-colors ${sortBy === "recent" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Recent
                  </button>
                  <button 
                    onClick={() => updateParam("sort", "viewed")} 
                    className={`px-2.5 py-1 rounded-md transition-colors ${sortBy === "viewed" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Viewed
                  </button>
                  <button 
                    onClick={() => updateParam("sort", "liked")} 
                    className={`px-2.5 py-1 rounded-md transition-colors ${sortBy === "liked" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Liked
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Popular Topics / Tags Filter Bar */}
          {selectedTab !== "analytics" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-b border-border/30 text-xs">
              <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0 mr-1">
                <Tag className="h-3.5 w-3.5 text-primary" /> Topics:
              </span>
              <button
                onClick={() => updateParam("tag", "all")}
                className={`px-3 py-1 rounded-full border transition-all font-medium whitespace-nowrap ${selectedTag === "all" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
              >
                All Topics
              </button>
              {POPULAR_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => updateParam("tag", tag)}
                  className={`px-3 py-1 rounded-full border transition-all font-medium whitespace-nowrap ${selectedTag.toLowerCase() === tag.toLowerCase() ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {selectedTab !== "analytics" && (
            <div className="flex items-center justify-between bg-muted/20 border border-border/40 rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-foreground font-bold">{currentItems ? currentItems.length : 0} results</span>
                <span>matching {selectedTab === "mycontent" ? "your uploads" : "creator community content"}</span>
                {selectedTag !== "all" && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 h-4 bg-primary/10 text-primary border border-primary/20">
                    Tag: #{selectedTag}
                  </Badge>
                )}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 h-4 bg-primary/10 text-primary border border-primary/20">
                    {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
                  </Badge>
                )}
              </div>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetAllFilters}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          <TabsContent value="browse" className="space-y-6 pt-1">
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

          <TabsContent value="mycontent" className="space-y-6 pt-1">
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

      {/* Upload / Edit Modal with Live Preview */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                {editingItem ? "Edit Content Piece" : "Upload New Content"}
              </DialogTitle>
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs font-medium border border-border/40">
                <button
                  type="button"
                  onClick={() => setModalMode("edit")}
                  className={`px-3 py-1 rounded-md transition-colors ${modalMode === "edit" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Edit className="h-3.5 w-3.5 inline mr-1" /> Edit Form
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("preview")}
                  className={`px-3 py-1 rounded-md transition-colors ${modalMode === "preview" ? "bg-background shadow-sm text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Eye className="h-3.5 w-3.5 inline mr-1" /> Live Preview
                </button>
              </div>
            </div>
          </DialogHeader>

          {modalMode === "edit" ? (
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
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium capitalize transition-all ${formType === type ? 'border-primary bg-primary/10 text-primary shadow-sm font-bold' : 'border-border/60 hover:bg-muted/50 text-muted-foreground'}`}
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
                  placeholder="e.g. Complete Guide to React Server Components & Streaming"
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
                    Media URL (YouTube/Vimeo embed or Image URL)
                  </label>
                  <Input
                    placeholder="e.g. https://www.youtube.com/watch?v=... or image link"
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Topics / Tags (comma-separated or click chips)
                </label>
                <Input
                  placeholder="e.g. React, WebDev, UIUX"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TAGS.map(tag => {
                    const isSelected = formTags.split(",").map(t => t.trim().toLowerCase()).includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagChipToggle(tag)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted"}`}
                      >
                        {isSelected && <Check className="h-3 w-3 inline mr-0.5" />} #{tag}
                      </button>
                    );
                  })}
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Content Body, Tutorial text, or Code Snippets <span className="text-destructive">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">Tip: Wrap code with ```lang ... ```</span>
                </label>
                <Textarea
                  rows={6}
                  placeholder={formType === 'video' ? "Describe your video tutorial, timestamps, and key learnings..." : formType === 'project' ? "Paste project overview, installation steps, and code snippets...\n\n```javascript\nconst app = express();\n```" : "Write your article or tutorial content..."}
                  value={formBody}
                  onChange={(e) => {
                    setFormBody(e.target.value);
                    if (validationErrors.body) setValidationErrors({ ...validationErrors, body: undefined });
                  }}
                  className={`font-mono text-xs ${validationErrors.body ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {validationErrors.body && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" /> {validationErrors.body}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Live Preview Mode */
            <div className="space-y-6 py-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                <span>This is a real-time preview of how your content will look to fellow students on the feed and detail modal.</span>
              </div>

              <div className="border border-border/60 rounded-xl p-6 bg-card shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`font-medium ${typeColors[formType]}`}>
                    {typeIcons[formType]}
                    <span className="capitalize">{formType}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">• Just now</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight">{formTitle || "Untitled Content Piece"}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border/40 pb-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="font-semibold text-foreground">{user?.name || "You"}</span>
                </div>

                {formMediaUrl && <MediaEmbedViewer url={formMediaUrl} title={formTitle} />}

                {formDescription && (
                  <p className="font-medium text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40 italic text-sm">
                    {formDescription}
                  </p>
                )}

                <FormattedBodyRenderer text={formBody || "No content body added yet..."} />

                {formTags && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/40">
                    {formTags.split(",").map(t => t.trim()).filter(Boolean).map((t, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
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

      {/* Rich Content Detail Viewer Modal with Comments */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        {viewingItem && (
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`font-medium ${typeColors[viewingItem.type]}`}>
                    {typeIcons[viewingItem.type]}
                    <span className="capitalize">{viewingItem.type}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">• {formatDate(viewingItem.createdAt)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)} className="h-7 px-2 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Feed
                </Button>
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight pt-1">{viewingItem.title}</DialogTitle>
              <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                    {(typeof viewingItem.userId === 'object' ? viewingItem.userId?.name : viewingItem.creatorName)?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground leading-none">
                      {typeof viewingItem.userId === 'object' ? viewingItem.userId?.name : viewingItem.creatorName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Creator • Student Community</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1 text-blue-500">
                    <Eye className="h-4 w-4" />
                    <span>{viewingItem.views?.toLocaleString() || 0} views</span>
                  </div>
                  <button 
                    onClick={() => handleLike(viewingItem)}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors bg-red-500/10 px-2.5 py-1 rounded-full text-red-500"
                  >
                    <Heart className={`h-4 w-4 ${user && viewingItem.likedBy && viewingItem.likedBy.includes(user._id || user.id) ? 'fill-current' : ''}`} />
                    <span>{viewingItem.likes?.toLocaleString() || 0}</span>
                  </button>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2 space-y-4">
              {viewingItem.mediaUrl && <MediaEmbedViewer url={viewingItem.mediaUrl} title={viewingItem.title} />}

              {viewingItem.description && viewingItem.description !== viewingItem.body && (
                <p className="font-medium text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/40 italic text-sm md:text-base leading-relaxed">
                  {viewingItem.description}
                </p>
              )}

              <FormattedBodyRenderer text={viewingItem.body} />
            </div>

            {viewingItem.tags && viewingItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/40">
                <span className="text-xs text-muted-foreground font-semibold flex items-center mr-1"><Tag className="h-3 w-3 mr-1" /> Topics:</span>
                {viewingItem.tags.map((tag, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    onClick={() => { setViewingItem(null); updateParam("tag", tag); }}
                    className="text-xs cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Live Comments Section */}
            <div className="mt-6 pt-6 border-t-2 border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Discussion ({viewingItem.commentsCount || (viewingItem.comments ? viewingItem.comments.length : 0)})
                </h3>
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  placeholder={user ? "Write a comment or question for the creator..." : "Sign in to leave a comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!user || commentMutation.isPending}
                  className="bg-muted/30"
                />
                <Button type="submit" disabled={!user || !commentText.trim() || commentMutation.isPending} className="shrink-0 font-semibold">
                  {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Post
                </Button>
              </form>

              <div className="space-y-3 pt-2 max-h-60 overflow-y-auto pr-1">
                {!viewingItem.comments || viewingItem.comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border/40">
                    No comments yet. Be the first to start the discussion!
                  </p>
                ) : (
                  viewingItem.comments.map((c, i) => (
                    <div key={i} className="p-3 bg-muted/25 rounded-xl border border-border/40 space-y-1 text-sm">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{c.authorName}</span>
                        <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-foreground/90 leading-relaxed text-xs sm:text-sm">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default CreatorsZone;
