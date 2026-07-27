import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import useDebounce from "@/hooks/useDebounce";
import { 
  Sparkles, Upload, TrendingUp, Eye, Heart, FileText,
  Loader2, AlertCircle, Search, X
} from "lucide-react";
import { toast } from "sonner";
import { 
  useCreatorFeed, 
  useMyCreatorContent, 
  useCreateCreatorContent, 
  useUpdateCreatorContent, 
  useDeleteCreatorContent, 
  useLikeCreatorContent, 
  useCommentCreatorContent,
  useReplyCreatorComment,
  useReportCreatorContent,
  useSeedCreatorContent,
  useCreatorContentDetail,
  useCreatorRecommendations,
  useCheckContentSimilarity,
  useCreatorReviewRequests,
  CreatorContentItem
} from "@/hooks/useCreators";

import { CreatorCard } from "@/components/creators/CreatorCard";
import { CreatorsFilterBar } from "@/components/creators/CreatorsFilterBar";
import { CreatorDetailModal } from "@/components/creators/CreatorDetailModal";
import { CreatorUploadDialog } from "@/components/creators/CreatorUploadDialog";
import { CreatorReportModal } from "@/components/creators/CreatorReportModal";
import { CreatorAnalytics } from "@/components/creators/CreatorAnalytics";
import { CreatorPortfolioExportModal } from "@/components/creators/CreatorPortfolioExportModal";
import { CreatorReviewModal } from "@/components/creators/CreatorReviewModal";
import { Download } from "lucide-react";

const POPULAR_TAGS = ["DSA", "Web Dev", "Career Advice", "Design", "AI", "React", "Python", "UIUX", "SystemDesign", "OpenSource"];

const CreatorsZone: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Tabs
  const [selectedTab, setSelectedTab] = useState<string>(searchParams.get("tab") || "browse");
  const [selectedFilter, setSelectedFilter] = useState<string>(searchParams.get("type") || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "recent");
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get("tag") || "all");
  const [searchInput, setSearchInput] = useState<string>(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"upload" | "edit">("upload");
  const [editingItem, setEditingItem] = useState<CreatorContentItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CreatorContentItem | null>(null);

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | undefined>(undefined);
  const [reportReason, setReportReason] = useState("");

  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Form States
  const [formType, setFormType] = useState<string>("article");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [validationErrors, setValidationErrors] = useState<{title?: string; body?: string}>({});
  const [formRelatedModule, setFormRelatedModule] = useState<string>("none");
  const [formRelatedItemId, setFormRelatedItemId] = useState<string>("");
  const [formRelatedItemLabel, setFormRelatedItemLabel] = useState<string>("");
  const [formReviewers, setFormReviewers] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading, error: recommendationsError, refetch: refetchRecommendations } = useCreatorRecommendations();
  const { data: reviewRequests = [] } = useCreatorReviewRequests();

  // Deep Link Handling
  const targetContentId = searchParams.get("id");
  const { data: directLinkItem, isError: directLinkError } = useCreatorContentDetail(targetContentId);

  useEffect(() => {
    if (directLinkError) {
      toast.error("Content not found. It may have been removed or is a private draft.");
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("id");
        return next;
      });
    }
  }, [directLinkError]);

  // Accessibility live region announcement
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  useEffect(() => {
    if (debouncedSearch) {
      setLiveAnnouncement(`Searching for "${debouncedSearch}". Showing filtered results.`);
    } else if (selectedFilter !== "all" || selectedTag !== "all" || sortBy !== "recent") {
      setLiveAnnouncement(`Filters updated: ${selectedFilter !== "all" ? selectedFilter : "all types"}, topic ${selectedTag}, sorted by ${sortBy}.`);
    }
  }, [selectedFilter, selectedTag, sortBy, debouncedSearch]);

  // Mutations
  const createMutation = useCreateCreatorContent();
  const updateMutation = useUpdateCreatorContent();
  const deleteMutation = useDeleteCreatorContent();
  const likeMutation = useLikeCreatorContent();
  const seedMutation = useSeedCreatorContent();
  const commentMutation = useCommentCreatorContent();
  const replyMutation = useReplyCreatorComment();
  const reportMutation = useReportCreatorContent();
  const similarityMutation = useCheckContentSimilarity();

  const debouncedTitle = useDebounce(formTitle, 2000);
  const debouncedBody = useDebounce(formBody, 2000);

  useEffect(() => {
    if (isModalOpen && (debouncedTitle || debouncedBody)) {
      if (editingItem && editingItem.status === 'published') return;
      if (createMutation.isPending || updateMutation.isPending) return;

      const contentData = {
        title: formTitle || "Untitled Draft",
        description: formDescription,
        body: formBody || "...",
        type: formType,
        thumbnail: formThumbnail,
        mediaUrl: formMediaUrl,
        tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
        relatedModule: formRelatedModule,
        relatedItemId: formRelatedItemId,
        relatedItemLabel: formRelatedItemLabel,
        reviewers: formReviewers,
        status: "draft"
      };

      setIsAutoSaving(true);
      if (editingItem?._id) {
        updateMutation.mutate({ id: editingItem._id, data: contentData }, {
          onSuccess: (data) => {
            setIsAutoSaving(false);
            setLastSavedAt(new Date());
            setEditingItem(data);
          },
          onError: () => setIsAutoSaving(false)
        });
      } else {
        createMutation.mutate(contentData, {
          onSuccess: (data) => {
            setIsAutoSaving(false);
            setLastSavedAt(new Date());
            setEditingItem(data);
            setModalMode("edit");
          },
          onError: () => setIsAutoSaving(false)
        });
      }
    }
  }, [debouncedTitle, debouncedBody]);

  const updateParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== "all") next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  useEffect(() => {
    if (searchParams.get("type")) setSelectedFilter(searchParams.get("type") as string);
    if (searchParams.get("sort")) setSortBy(searchParams.get("sort") as string);
    if (searchParams.get("tag")) setSelectedTag(searchParams.get("tag") as string);
    if (searchParams.get("q") !== null) setSearchInput(searchParams.get("q") as string);
    if (searchParams.get("tab")) setSelectedTab(searchParams.get("tab") as string);
  }, [searchParams]);

  useEffect(() => {
    if (directLinkItem && !viewingItem && !isModalOpen) {
      setViewingItem(directLinkItem);
    }
  }, [directLinkItem]);

  const { 
    data: feedData, isLoading: feedLoading, isError: feedError, refetch: refetchFeed,
    fetchNextPage: fetchNextFeed, hasNextPage: hasNextFeed, isFetchingNextPage: isFetchingNextFeed
  } = useCreatorFeed(selectedFilter, debouncedSearch, sortBy, selectedTag);
  const feedItems = feedData?.pages.flatMap(p => p.data) || [];

  const { 
    data: myData, isLoading: myLoading, isError: myError, refetch: refetchMy,
    fetchNextPage: fetchNextMy, hasNextPage: hasNextMy, isFetchingNextPage: isFetchingNextMy
  } = useMyCreatorContent(selectedFilter, debouncedSearch, sortBy, selectedTag);
  const myItems = myData?.pages.flatMap(p => p.data) || [];

  const handleCardClick = (item: CreatorContentItem) => {
    if (item.status === 'draft') {
      openEditModal(item, { stopPropagation: () => {} } as React.MouseEvent);
    } else {
      setViewingItem(item);
    }
  };
  const closeDetailView = () => setViewingItem(null);
  
  const handleLike = (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item._id) likeMutation.mutate(item._id);
  };

  const handleCreatorClick = (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Implementation for navigation to creator profile would go here
  };

  const openCreateModal = () => {
    setModalMode("upload");
    setEditingItem(null);
    setFormType("article");
    setFormTitle("");
    setFormDescription("");
    setFormBody("");
    setFormThumbnail("");
    setFormMediaUrl("");
    setFormTags("");
    setFormRelatedModule("none");
    setFormRelatedItemId("");
    setFormRelatedItemLabel("");
    setFormReviewers([]);
    setLastSavedAt(null);
    setIsAutoSaving(false);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingItem(item);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormBody(item.body || "");
    setFormThumbnail(item.thumbnail || "");
    setFormMediaUrl(item.mediaUrl || "");
    setFormTags(item.tags ? item.tags.join(", ") : "");
    setFormRelatedModule(item.relatedModule || "none");
    setFormRelatedItemId(item.relatedItemId || "");
    setFormRelatedItemLabel(item.relatedItemLabel || "");
    setFormReviewers((item as any).reviewers || []);
    setLastSavedAt(null);
    setIsAutoSaving(false);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (item: CreatorContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this content?")) {
      if (item._id) deleteMutation.mutate(item._id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { title?: string; body?: string } = {};
    if (!formTitle.trim()) errors.title = "Title is required";
    if (!formBody.trim()) errors.body = "Content body or link URL is required";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Phase 9: Content Integrity Check
    try {
      const similarityResult = await similarityMutation.mutateAsync({ title: formTitle, body: formBody });
      if (similarityResult.isSimilar) {
        if (!window.confirm(`High similarity (${Math.round(similarityResult.score * 100)}%) to existing content detected. Are you sure you want to publish this?`)) {
          return;
        }
      }
    } catch (err) {
      // Ignore if similarity check fails, proceed anyway
    }
    
    const contentData = {
      title: formTitle,
      description: formDescription,
      body: formBody,
      type: formType,
      thumbnail: formThumbnail,
      mediaUrl: formMediaUrl,
      tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
      relatedModule: formRelatedModule,
      relatedItemId: formRelatedItemId,
      relatedItemLabel: formRelatedItemLabel,
      reviewers: formReviewers,
      status: formReviewers.length > 0 ? "in_review" : "published"
    };

    if (modalMode === "edit" && editingItem?._id) {
      updateMutation.mutate({ id: editingItem._id, data: contentData }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(contentData, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const handleReportSubmit = () => {
    if (reportTargetId && reportReason.trim()) {
      reportMutation.mutate(
        { id: reportTargetId, reason: reportReason, commentId: reportCommentId },
        {
          onSuccess: () => {
            setReportModalOpen(false);
            setReportTargetId(null);
            setReportCommentId(undefined);
            setReportReason("");
          }
        }
      );
    }
  };

  const handleSeedDemo = () => seedMutation.mutate();

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSelectedFilter("all");
    setSortBy("recent");
    setSelectedTag("all");
    setSearchInput("");
  };

  const renderContentCards = (items: CreatorContentItem[] | undefined, isMyContentView: boolean) => {
    if (!items || items.length === 0) {
      return (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-bold text-xl">No content found</h3>
          <p className="text-muted-foreground max-w-md">Try adjusting your filters or search terms.</p>
          {(selectedFilter !== "all" || debouncedSearch || selectedTag !== "all") && (
            <Button variant="outline" onClick={resetAllFilters} className="mt-2">Clear Filters</Button>
          )}
        </div>
      );
    }

    const hasNext = isMyContentView ? hasNextMy : hasNextFeed;
    const fetchNext = isMyContentView ? fetchNextMy : fetchNextFeed;
    const isFetchingNext = isMyContentView ? isFetchingNextMy : isFetchingNextFeed;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <ScrollReveal key={item._id} delay={0.05 * (index % 6)}>
              <CreatorCard
                item={item}
                user={user}
                isMyContentView={isMyContentView}
                onCardClick={handleCardClick}
                onCreatorClick={handleCreatorClick}
                onLike={handleLike}
                onTagClick={(t, e) => {
                  e.stopPropagation();
                  updateParam("tag", t);
                }}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onReport={(it, e) => {
                  e.stopPropagation();
                  if (it._id) {
                    setReportTargetId(it._id);
                    setReportCommentId(undefined);
                    setReportModalOpen(true);
                  }
                }}
              />
            </ScrollReveal>
          ))}
        </div>
        {hasNext && (
          <div className="flex justify-center pt-4 pb-8">
            <Button variant="outline" onClick={() => fetchNext()} disabled={isFetchingNext} className="w-full sm:w-auto font-semibold shadow-sm">
              {isFetchingNext ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              Load More {isMyContentView ? "Content" : "Creators"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>
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
                  Creators <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary">Zone</span>
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-6">
                  Discover, learn, and share knowledge. A community-driven space for interview prep, tutorials, open-source projects, and career advice.
                </p>
                <div className="flex justify-center gap-3">
                  <Button size="lg" className="font-bold shadow-md rounded-full px-8 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={openCreateModal} aria-label="Upload content and become a creator">
                    <Upload className="mr-2 h-4 w-4" />
                    Become a Creator
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="browse" value={selectedTab} onValueChange={(v) => updateParam("tab", v)} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="overflow-x-auto pb-2 -mb-2 scrollbar-none w-full md:w-auto flex">
              <TabsList className="bg-muted/50 p-1 border border-border/40 rounded-full w-max md:w-auto h-auto flex min-w-max">
                <TabsTrigger value="suggested" className="rounded-full px-6 py-2 sm:py-1.5 font-medium min-h-[44px] sm:min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary">For You</TabsTrigger>
                <TabsTrigger value="browse" className="rounded-full px-6 py-2 sm:py-1.5 font-medium min-h-[44px] sm:min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary">Browse Feed</TabsTrigger>
                <TabsTrigger value="mycontent" className="rounded-full px-6 py-2 sm:py-1.5 font-medium min-h-[44px] sm:min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary">My Content</TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-full px-6 py-2 sm:py-1.5 font-medium min-h-[44px] sm:min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary">Analytics</TabsTrigger>
              </TabsList>
            </div>

            {selectedTab !== "analytics" && (
              <div className="pt-2">
                <CreatorsFilterBar
                  selectedFilter={selectedFilter}
                  selectedTag={selectedTag}
                  sortBy={sortBy}
                  searchInput={searchInput}
                  onSearchChange={setSearchInput}
                  onClearSearch={() => { setSearchInput(""); updateParam("q", ""); }}
                  onFilterChange={(val) => updateParam("type", val)}
                  onSortChange={(val) => updateParam("sort", val)}
                  onTagChange={(val) => updateParam("tag", val)}
                  popularTags={POPULAR_TAGS}
                  totalResultsCount={selectedTab === 'browse' ? feedItems.length : myItems.length}
                  onResetAll={resetAllFilters}
                />
              </div>
            )}
          </div>

          
          <TabsContent value="suggested" className="space-y-6 pt-1">
            {recommendationsLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Loading recommendations...</p>
              </div>
            ) : recommendationsError ? (
              <Card className="max-w-md mx-auto py-8 text-center border-destructive/30 bg-destructive/5">
                <CardContent className="space-y-3">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                  <h3 className="font-bold text-lg">Failed to load recommendations</h3>
                  <p className="text-sm text-muted-foreground">Could not reach the backend server.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchRecommendations()}>Retry</Button>
                </CardContent>
              </Card>
            ) : (
              renderContentCards(recommendationsData || [], false)
            )}
          </TabsContent>

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
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setExportModalOpen(true)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Portfolio
                  </Button>
                </div>
                {renderContentCards(myItems, true)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="pt-4">
            <div className="max-w-6xl mx-auto">
              <CreatorAnalytics />
            </div>
          </TabsContent>
        
          <TabsContent value="review_requests" className="m-0 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {reviewRequests.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted">
                <PenTool className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Review Requests</h3>
                <p>You have no pending drafts to review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviewRequests.map((item: any) => (
                  <div key={item._id} className="relative group">
                    <CreatorCard
                      item={item}
                      currentUserId={user?.id || ''}
                      onLike={() => {}}
                      onCommentClick={() => {}}
                      onClick={() => { setReviewItem(item); setIsReviewModalOpen(true); }}
                      onCreatorClick={handleCreatorClick}
                    />
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl z-10 gap-2">
                      <Button onClick={() => { setReviewItem(item); setIsReviewModalOpen(true); }} className="gap-2">
                        <PenTool className="w-4 h-4" /> Review Draft
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
  
        </Tabs>
      </div>

      <CreatorUploadDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        onModeChange={setModalMode}
        isEditing={!!editingItem}
        title={formTitle}
        onTitleChange={(val) => {
          setFormTitle(val);
          if (validationErrors.title) setValidationErrors({ ...validationErrors, title: undefined });
        }}
        type={formType}
        onTypeChange={setFormType}
        description={formDescription}
        onDescriptionChange={setFormDescription}
        body={formBody}
        onBodyChange={(val) => {
          setFormBody(val);
          if (validationErrors.body) setValidationErrors({ ...validationErrors, body: undefined });
        }}
        thumbnail={formThumbnail}
        onThumbnailChange={setFormThumbnail}
        mediaUrl={formMediaUrl}
        onMediaUrlChange={setFormMediaUrl}
        tags={formTags.split(",").map((t: string) => t.trim()).filter(Boolean)}
        onTagsChange={(newTags: string[]) => setFormTags(newTags.join(", "))}
        relatedModule={formRelatedModule}
        onRelatedModuleChange={setFormRelatedModule}
        relatedItemId={formRelatedItemId}
        onRelatedItemIdChange={setFormRelatedItemId}
        relatedItemLabel={formRelatedItemLabel}
        onRelatedItemLabelChange={setFormRelatedItemLabel}
        reviewers={formReviewers}
        onReviewersChange={setFormReviewers}
        popularTags={POPULAR_TAGS}
        errors={validationErrors}
        isSubmitting={createMutation.isPending || updateMutation.isPending || similarityMutation.isPending}
        isAutoSaving={isAutoSaving}
        lastSavedAt={lastSavedAt}
        onSubmit={handleSubmit}
      />

      <CreatorDetailModal
        item={viewingItem}
        user={user}
        onClose={closeDetailView}
        onCreatorClick={handleCreatorClick}
        onLike={handleLike}
        onCommentSubmit={async (text: string) => {
          if (!viewingItem) return;
          const updated = await commentMutation.mutateAsync({ id: viewingItem._id, text });
          setViewingItem(updated);
        }}
        onReplySubmit={async (commentId: string, text: string) => {
          if (!viewingItem) return;
          const updated = await replyMutation.mutateAsync({ id: viewingItem._id, commentId, text });
          setViewingItem(updated);
        }}
        onReport={(item: any, commentId?: string) => {
          if (item._id) {
            setReportTargetId(item._id);
            setReportCommentId(commentId);
            setReportModalOpen(true);
          }
        }}
        commentLoading={commentMutation.isPending}
        replyLoading={replyMutation.isPending}
        onAnnounce={setLiveAnnouncement}
      />

      <CreatorReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportTargetId(null);
          setReportCommentId(undefined);
        }}
        reason={reportReason}
        onReasonChange={setReportReason}
        onSubmit={handleReportSubmit}
        isSubmitting={reportMutation.isPending}
        targetTitle={viewingItem?.title}
        isComment={!!reportCommentId}
      />

      <CreatorPortfolioExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        items={myItems}
        user={user}
      />
    </div>
  );
};

export default CreatorsZone;
