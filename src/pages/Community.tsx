import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Send, Loader2, Sparkles, Image as ImageIcon, X, MoreHorizontal, AlertCircle, Edit, Trash2, Share2, ThumbsUp, PartyPopper, Lightbulb, HandHeart, Bookmark, ShieldAlert, Pin, BarChart2, Shield, VolumeX, Ban, CheckCircle2, Globe, Users, Award, Calendar, HelpCircle, BellOff, TrendingUp } from "lucide-react";
import { useCommunityFeed, createPost, togglePostLike, toggleSavePost, usePostComments, postComment, deletePost, reportPost, editPost, getPostReactions, pinPost, viewPost, type CommunityPost, toggleFollowUser, checkFollowStatus, getUserInterests, updateUserInterests, getSimilarPosts, votePoll, toggleMuteUser, toggleBlockUser, resolveQuestion, toggleMutePost } from "@/hooks/useCommunity";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { RichComposer } from "@/components/community/RichComposer";
import { RichText } from "@/components/community/RichText";
import { LinkPreview } from "@/components/community/LinkPreview";
import { ImageGallery } from "@/components/community/ImageGallery";
import { PollRenderer } from "@/components/community/PollRenderer";
import { ModerationDashboard } from "@/components/community/ModerationDashboard";
import { useIsOnline } from "@/hooks/useIsOnline";

const PRESET_TAGS = ["General", "Scholarships", "Advice", "Networking", "Events", "Q&A", "Success Story"];


const Community = () => {
  const isOnline = useIsOnline();
  const [offlinePosts, setOfflinePosts] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('community_offline_posts') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOnline && offlinePosts.length > 0) {
      const syncPosts = async () => {
        let successCount = 0;
        for (const op of offlinePosts) {
          const r = await createPost(op);
          if (r) successCount++;
        }
        if (successCount > 0) {
          toast.success(`Successfully synced ${successCount} offline post(s)!`);
        }
        setOfflinePosts([]);
        localStorage.removeItem('community_offline_posts');
      };
      syncPosts();
    }
  }, [isOnline]);

  
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  useEffect(() => {
    if ((user as any)?.locale) {
      i18n.changeLanguage((user as any).locale);
    }
  }, [user, i18n]);
  const handleLangChange = async (newLang: 'en'|'te') => {
    i18n.changeLanguage(newLang);
    if (user) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ locale: newLang })
        });
      } catch (err) {
        console.error('Failed to sync locale', err);
      }
    }
  };
  const [sort, setSort] = useState("newest");
  const [showModDashboard, setShowModDashboard] = useState(false);
  const isModerator = user?.role === 'admin' || (user as any)?.adminRole === 'moderator';
  const [tagFilter, setTagFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [showInterestsDialog, setShowInterestsDialog] = useState(false);
  const [tempInterests, setTempInterests] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      getUserInterests().then(tags => {
        setMyInterests(tags);
        setTempInterests(tags);
      });
    }
  }, [user]);

  const handleSaveInterests = async () => {
    const res = await updateUserInterests(tempInterests);
    if (res) {
      setMyInterests(res.tags);
      setShowInterestsDialog(false);
      toast.success("Interests updated");
    } else {
      toast.error("Failed to update interests");
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  const { posts, setPosts, loading, loadingMore, status, hasMore, loadMore, queuedPosts, flushQueue } = useCommunityFeed(sort, tagFilter, debouncedSearch, user?.id);
  
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, hasMore, loading, loadingMore, loadMore]);

  const handleComposerSubmit = async (
    content: string, 
    tags: string[], 
    files: File[], 
    poll?: any, 
    options?: { privacy: string, clubId?: string, template: string, templateData?: any },
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    if (!isOnline) {
      if (files.length > 0) {
        toast.error("Cannot upload images while offline.");
        return;
      }
      const postPayload = { content, tags, poll, ...options };
      const newQueue = [...offlinePosts, postPayload];
      setOfflinePosts(newQueue);
      localStorage.setItem('community_offline_posts', JSON.stringify(newQueue));
      toast.info("You're offline. Post saved and will be sent when you reconnect.");
      return true;
    }

    let uploadedImageUrls: string[] = [];
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      try {
        const res = await axios.post(`${API_URL}/api/uploads/multiple`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Idempotency-Key': idempotencyKey,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        });
        
        uploadedImageUrls = res.data.urls;
      } catch (e) {
        console.error("Upload error", e);
        toast.error("Image upload error. Please try again.");
        return false;
      }
    }

      const r = await createPost({ content, tags, image_urls: uploadedImageUrls, poll, ...options });
      if (r) {
        if (r.status === 'pending_review') {
          setPosts(prev => [r, ...prev]);
          toast.info("Your post is under review due to moderation guidelines.");
        } else {
          setPosts(prev => {
            if (prev.find(p => p.id === r.id)) return prev;
            return [r, ...prev];
          });
          toast.success("Post published!");
        }
        return true;
      }
      return false;
    };

  const handleOptimisticLike = async (postId: string, type: string = 'like') => {
    if (!user) { toast.error("Please sign in"); return; }
    
    let originalPost: any = null;

    // Optistic UI update
    setPosts(prev => {
      originalPost = prev.find(p => p.id === postId);
      return prev.map(p => {
        if (p.id === postId) {
          let newReactions = { ...p.reactions } as any;
          if (!newReactions) newReactions = { like: 0, celebrate: 0, insightful: 0, support: 0 };
          let newLikeCount = p.like_count;
          let newUserReaction = p.user_reaction;

          if (p.user_reaction === type) {
            // Toggle off
            newReactions[type] = Math.max(0, (newReactions[type] || 1) - 1);
            newLikeCount = Math.max(0, newLikeCount - 1);
            newUserReaction = null;
          } else {
            // Changed or Added
            if (p.user_reaction) {
              newReactions[p.user_reaction] = Math.max(0, (newReactions[p.user_reaction] || 1) - 1);
            } else {
              newLikeCount++;
            }
            newReactions[type] = (newReactions[type] || 0) + 1;
            newUserReaction = type;
          }

          return {
            ...p,
            like_count: newLikeCount,
            reactions: newReactions,
            user_reaction: newUserReaction
          };
        }
        return p;
      });
    });
    
    // API call
    try {
      const res = await togglePostLike(postId, type);
      if (res && res.reactions) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: res.like_count, reactions: res.reactions } : p));
      } else if (originalPost) {
        toast.error("Failed to update reaction");
        setPosts(prev => prev.map(p => p.id === postId ? originalPost : p));
      }
    } catch (e) {
      if (originalPost) {
        toast.error("Failed to update reaction");
        setPosts(prev => prev.map(p => p.id === postId ? originalPost : p));
      }
    }
  };

  const handleOptimisticSave = async (postId: string) => {
    if (!user) { toast.error("Please sign in"); return; }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_saved: !p.is_saved } : p));
    await toggleSavePost(postId);
  };

  const handleOptimisticVote = async (postId: string, optionIndex: number) => {
    if (!user) { toast.error("Please sign in"); return; }
    
    let originalPost: any = null;

    // Optimistic Update
    setPosts(prev => {
      originalPost = prev.find(p => p.id === postId);
      return prev.map(p => {
        if (p.id === postId && p.poll) {
          const newPoll = { ...p.poll };
          newPoll.options = [...newPoll.options];
          newPoll.options[optionIndex].votes = (newPoll.options[optionIndex].votes || 0) + 1;
          return { ...p, poll: newPoll, user_voted_option_index: optionIndex };
        }
        return p;
      });
    });

    // API call
    try {
      const updatedPost = await votePoll(postId, optionIndex);
      if (updatedPost && updatedPost.poll) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, poll: updatedPost.poll, user_voted_option_index: updatedPost.user_voted_option_index } : p));
      } else if (originalPost) {
        toast.error("Failed to submit vote");
        setPosts(prev => prev.map(p => p.id === postId ? originalPost : p));
      }
    } catch (e) {
      if (originalPost) {
        toast.error("Failed to submit vote");
        setPosts(prev => prev.map(p => p.id === postId ? originalPost : p));
      }
    }
  };

  const handleOptimisticComment = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comment_count: p.comment_count + 1 };
      }
      return p;
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
                {t("Community")}
                {isModerator && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setShowModDashboard(true)} title="Moderation Dashboard">
                    <Shield className="h-4 w-4" />
                  </Button>
                )}
              </h2>
              <div className="space-y-1">
                <button onClick={() => setTagFilter("")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${tagFilter === "" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{t("Community Feed")}</button>
                <button onClick={() => { setSort("trending"); setTagFilter(""); }} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${sort === "trending" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>
                  <TrendingUp className="h-4 w-4" /> {t("Trending Tags")}
                </button>
                <button onClick={() => setTagFilter("saved")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${tagFilter === "saved" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{t("Saved")}</button>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <div className="flex bg-secondary/50 rounded-lg p-1">
                    <button onClick={() => handleLangChange('en')} className={`px-2 py-1 text-xs rounded-md ${i18n.language === 'en' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>EN</button>
                    <button onClick={() => handleLangChange('te')} className={`px-2 py-1 text-xs rounded-md ${i18n.language === 'te' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>TE</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          {!isOnline && (
            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-4 py-2 mb-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> You're offline — showing cached posts. Any new posts will be sent when you reconnect.
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="space-y-4">
            <div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20"><Sparkles className="mr-1 h-3 w-3" />{t("Community")}</Badge>
              <h1 className="text-3xl font-bold mt-2">{t("Community Feed")}</h1>
            </div>
            
            <div className="flex gap-4 border-b border-border">
              <button 
                onClick={() => setTagFilter("")}
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${tagFilter !== "saved" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t("All Posts")}
              </button>
              <button 
                onClick={() => setTagFilter("saved")}
                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${tagFilter === "saved" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t("Saved Posts")}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full justify-end">
              <SyncStatusIndicator status={status} />
              <div className="flex items-center bg-secondary/30 rounded-lg p-1 border">
                {user && (
                  <>
                    <button
                      onClick={() => setSort("for_you")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sort === "for_you" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      For You
                    </button>
                    <button
                      onClick={() => setSort("following")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sort === "following" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Following
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSort("newest")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sort === "newest" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("Recent")}
                </button>
                <button
                  onClick={() => setSort("trending")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sort === "trending" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("Trending Tags")}
                </button>
                <button
                  onClick={() => setSort("most_liked")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sort === "most_liked" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("Top")}
                </button>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 bg-secondary/20"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {tagFilter && tagFilter !== 'saved' && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing posts tagged:</span>
            <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer bg-primary/10 text-primary hover:bg-primary/20" onClick={() => setTagFilter("")}>
              {tagFilter} <X className="h-3 w-3" />
            </Badge>
          </div>
        )}

        {user && !tagFilter && (
          <div className="mb-6">
            {myInterests.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("Suggested topics")}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setTempInterests([...myInterests]); setShowInterestsDialog(true); }}>{t("Edit Interests")}</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {myInterests.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => setTagFilter(tag)}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { setTempInterests([]); setShowInterestsDialog(true); }}>{t("Add Interests")}</Button>
              </div>
            )}
          </div>
        )}

        {user && tagFilter !== 'saved' && (
          <RichComposer onSubmit={handleComposerSubmit} user={user} />
        )}

        {queuedPosts.length > 0 && (
          <div className="sticky top-24 z-50 flex justify-center mb-6 pointer-events-none" role="status" aria-live="polite">
            <Button 
              variant="default" 
              className="rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-top-4 motion-reduce:animate-none motion-reduce:transition-none pointer-events-auto flex items-center gap-2 h-10 px-6" 
              onClick={() => {
                flushQueue();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Sparkles className="h-4 w-4" />
              {queuedPosts.length} new post{queuedPosts.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}

        <div className="space-y-4 relative z-0">
          {loading && posts.length === 0 ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : posts.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">{t("No posts found")}</CardContent></Card>
          : posts.map((p) => (
            <PostCard 
              key={p.id} 
              post={p} 
              currentUserId={user?.id} 
              isModerator={isModerator}
              onPin={async () => {
                await pinPost(p.id!);
                setPosts(prev => prev.map(x => (x.id === p.id || x._id === p.id) ? { ...x, is_pinned: !x.is_pinned } : x));
              }}
              onLike={(type) => handleOptimisticLike(p.id!, type)} 
              onSave={() => handleOptimisticSave(p.id!)}
              onVote={(idx) => handleOptimisticVote(p.id!, idx)}
              onDelete={async () => {
                const ok = await deletePost(p.id!);
                if(ok) setPosts(prev => prev.filter(x => x.id !== p.id));
              }} 
              onCommentOptimistic={() => handleOptimisticComment(p.id!)} 
              onTagClick={setTagFilter} 
            />
          ))}
          
          <div ref={observerTarget} className="py-4 text-center">
            {loadingMore && <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />}
            {!hasMore && posts.length > 0 && <span className="text-xs text-muted-foreground">{t("You've reached the end!")}</span>}
          </div>
        </div>
      </section>

      <Dialog open={showInterestsDialog} onOpenChange={setShowInterestsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personalize your Feed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Select topics you're interested in to improve your "For You" feed.</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <Badge 
                  key={tag} 
                  variant={tempInterests.includes(tag) ? "default" : "outline"} 
                  className="cursor-pointer"
                  onClick={() => {
                    setTempInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveInterests}>Save Interests</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showModDashboard} onOpenChange={setShowModDashboard}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="h-5 w-5 text-primary" /> Moderation Dashboard
            </DialogTitle>
          </DialogHeader>
          <ModerationDashboard />
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
};

export const PostCard = ({ post, currentUserId, onLike, onSave, onVote, onDelete, onCommentOptimistic, onTagClick, isModerator, onPin }: { post: CommunityPost; currentUserId?: string; onLike: (type: string) => void; onSave: () => void; onVote?: (idx: number) => Promise<void>; onDelete: () => void; onCommentOptimistic: () => void; onTagClick?: (tag: string) => void; isModerator?: boolean; onPin?: () => void }) => {
  const [showComments, setShowComments] = useState(false);
  const isAuthor = currentUserId === post.user_id;
  const navigate = useNavigate();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(true);

  useEffect(() => {
    if (currentUserId && !isAuthor && post.author) {
      const authorId = post.author._id || post.author.id;
      if (authorId) {
        checkFollowStatus(authorId).then(status => {
          setIsFollowing(status);
          setIsFollowLoading(false);
        });
      } else {
        setIsFollowLoading(false);
      }
    } else {
      setIsFollowLoading(false);
    }
  }, [currentUserId, isAuthor, post.author]);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || !post.author) return;
    const authorId = post.author._id || post.author.id;
    if (!authorId) return;
    setIsFollowLoading(true);
    const res = await toggleFollowUser(authorId);
    if (res) {
      setIsFollowing(res.following);
    }
    setIsFollowLoading(false);
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [currentContent, setCurrentContent] = useState(post.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isEditedLocal, setIsEditedLocal] = useState(false);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  
  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      onDelete();
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || editContent === currentContent) {
      setIsEditing(false);
      return;
    }
    setIsSubmittingEdit(true);
    const updated = await editPost(post.id!, editContent);
    if (updated) {
      setCurrentContent(editContent);
      setIsEditedLocal(true);
      setIsEditing(false);
    }
    setIsSubmittingEdit(false);
  };

  const submitReport = async () => {
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }
    setIsReporting(true);
    const ok = await reportPost(post.id!, reportReason);
    if (ok) {
      setShowReportDialog(false);
      setReportReason("");
    }
    setIsReporting(false);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none motion-reduce:transition-none relative">
      {post.status === 'pending_review' && (
        <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 text-xs font-medium flex items-center gap-2 border-b">
          <AlertCircle className="h-3.5 w-3.5" />
          This post is pending review by moderators. Only you can see it right now.
        </div>
      )}
      {post.is_pinned && (
        <div className="bg-primary/5 text-primary px-4 py-1.5 text-xs font-medium flex items-center gap-2 border-b">
          <Pin className="h-3 w-3" /> Pinned
        </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10"><AvatarImage src={post.author?.avatar_url || ""} /><AvatarFallback>{(post.author?.full_name || "?")[0]}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm leading-none flex items-center gap-1">
                {post.author?.full_name || post.author?.username || "Anonymous"}
                {(post.author?.adminRole === 'moderator' || post.author?.communityTitle || post.author?.institutionVerified) && (
                  <Shield className="h-3.5 w-3.5 text-primary" title="Verified" />
                )}
              </p>
              {!isAuthor && currentUserId && (
                <button 
                  onClick={handleFollowClick}
                  disabled={isFollowLoading}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${isFollowing ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                >
                  {isFollowLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span className="cursor-pointer hover:underline" onClick={() => navigate(`/community/post/${post.id || post._id}`)}>
                {formatDistanceToNow(new Date(post.created_at || post.createdAt || Date.now()), { addSuffix: true })}
              </span>
              {isEditedLocal && <span className="opacity-70">(edited)</span>}
              {isAuthor && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <BarChart2 className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-48 p-3 z-50" align="start">
                    <div className="space-y-2 text-sm text-foreground">
                      <p className="font-semibold mb-1">Post Insights</p>
                      <div className="flex justify-between"><span>Views</span> <span className="font-medium">{post.view_count || 0}</span></div>
                      <div className="flex justify-between"><span>Reach</span> <span className="font-medium">{post.view_count || 0}</span></div>
                      <div className="flex justify-between"><span>Engagement</span> <span className="font-medium">{post.view_count ? Math.round(((post.like_count || 0) + (post.comment_count || 0)) / post.view_count * 100) : 0}%</span></div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/community/post/${post.id || post._id}`)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> View Full Post
            </DropdownMenuItem>
            {isModerator && (
              <DropdownMenuItem onClick={onPin}>
                <Pin className="mr-2 h-4 w-4" /> {post.is_pinned ? "Unpin Post" : "Pin Post"}
              </DropdownMenuItem>
            )}
            {post.tags?.includes("Events") && (
              <DropdownMenuItem onClick={() => {
                const title = encodeURIComponent(post.content.slice(0, 50) + (post.content.length > 50 ? '...' : ''));
                const details = encodeURIComponent(post.content + `\n\nLink: ${window.location.origin}/community?post=${post.id}`);
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
                window.open(url, '_blank');
              }}>
                <Pin className="mr-2 h-4 w-4" /> Add to Calendar
              </DropdownMenuItem>
            )}
            {isAuthor ? (
              <>
                <DropdownMenuItem onClick={() => { setIsEditing(true); setEditContent(currentContent); }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(post, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `post_${post.id}.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                  toast.success("Post data exported");
                }}>
                  <BarChart2 className="mr-2 h-4 w-4" /> Export Data
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteClick}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={async () => {
                  const muted = await toggleMutePost(post.id || post._id!);
                  if (muted) toast.success(`Post notifications ${muted.action}`);
                }}>
                  <BellOff className="mr-2 h-4 w-4" /> Mute Post Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  const authorId = post.author?._id || post.author?.id;
                  if (authorId) await toggleMuteUser(authorId);
                }}>
                  <VolumeX className="mr-2 h-4 w-4" /> Mute User
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => {
                  const authorId = post.author?._id || post.author?.id;
                  if (authorId) await toggleBlockUser(authorId);
                }}>
                  <Ban className="mr-2 h-4 w-4" /> Block User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <AlertCircle className="mr-2 h-4 w-4" /> Report Post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 space-y-3">
        {isEditing ? (
          <div className="space-y-2 mt-2">
            <textarea
              className="w-full min-h-[80px] p-2 bg-secondary/20 rounded-md border resize-y outline-none text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSubmittingEdit}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSubmittingEdit}>Cancel</Button>
              <Button size="sm" onClick={handleEditSubmit} disabled={isSubmittingEdit}>
                {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <RichText content={currentContent} />
            
            <ImageGallery images={post.image_urls && post.image_urls.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : [])} />
            
            {post.poll && onVote && (
              <PollRenderer 
                poll={post.poll} 
                userVotedIndex={post.user_voted_option_index} 
                onVote={onVote} 
              />
            )}

            {post.template === "achievement" && (
              <div className="my-3 p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-full">
                  <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Achievement Unlocked</p>
                  <p className="text-xs text-yellow-700/80 dark:text-yellow-400/80">{post.template_data?.type || "Milestone reached"}</p>
                </div>
              </div>
            )}
            
            {post.template === "event" && (
              <div className="my-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Upcoming Event</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {post.template_data?.date && (
                    <div><span className="text-muted-foreground text-xs">Date:</span> <br/>{post.template_data.date}</div>
                  )}
                  {post.template_data?.location && (
                    <div><span className="text-muted-foreground text-xs">Location:</span> <br/>{post.template_data.location}</div>
                  )}
                </div>
              </div>
            )}
            
            {post.template === "question" && (
              <div className={`my-3 p-3 border rounded-lg flex items-start justify-between gap-2 ${post.template_data?.is_resolved ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                <div className="flex gap-2">
                  <HelpCircle className={`h-5 w-5 mt-0.5 ${post.template_data?.is_resolved ? 'text-green-500' : 'text-orange-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{post.template_data?.is_resolved ? 'Question Resolved' : 'Question'}</p>
                    <p className="text-xs text-muted-foreground">{post.template_data?.is_resolved ? 'The author has marked this as resolved.' : 'Looking for answers.'}</p>
                  </div>
                </div>
                {isAuthor && !post.template_data?.is_resolved && (
                  <Button size="sm" variant="outline" className="h-7 text-xs bg-background" onClick={async () => {
                     const updated = await resolveQuestion(post.id!);
                     if (updated) {
                       window.location.reload(); // simple reload to show resolved state for now
                     }
                  }}>Mark Resolved</Button>
                )}
              </div>
            )}

            <LinkPreview preview={post.link_preview} />
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((t) => (
              <Badge 
                key={t} 
                variant="outline" 
                className={`text-[10px] py-0 px-2 h-5 bg-secondary/20 ${onTagClick ? 'cursor-pointer hover:bg-secondary/50' : ''}`}
                onClick={() => onTagClick && onTagClick(t)}
              >
                #{t}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-3 mt-3">
          <div className="relative group flex items-center">
            <button 
              aria-label={`React to post. Current reaction: ${post.user_reaction || 'None'}`}
              className={`flex items-center gap-1.5 transition-colors hover:text-primary ${post.user_reaction === 'celebrate' ? 'text-green-500 font-medium' : post.user_reaction === 'insightful' ? 'text-yellow-500 font-medium' : post.user_reaction === 'support' ? 'text-purple-500 font-medium' : post.user_reaction ? 'text-red-500 font-medium' : ''}`} 
              onClick={() => onLike('like')}
            >
              {post.user_reaction === 'celebrate' ? <PartyPopper className="h-4 w-4 fill-current" /> :
               post.user_reaction === 'insightful' ? <Lightbulb className="h-4 w-4 fill-current" /> :
               post.user_reaction === 'support' ? <HandHeart className="h-4 w-4 fill-current" /> :
               <Heart className={`h-4 w-4 ${post.user_reaction ? 'fill-current' : ''}`} />
              }
              <ReactionListPopover postId={post.id!}>
                <span className="group-hover:hidden cursor-pointer">{post.like_count}</span>
              </ReactionListPopover>
              <ReactionListPopover postId={post.id!}>
                <span className="hidden group-hover:inline capitalize cursor-pointer">{post.user_reaction || 'Like'} {post.like_count}</span>
              </ReactionListPopover>
            </button>
            
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-background border shadow-lg rounded-full px-2 py-1 gap-2 z-10 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none" role="menu" aria-label="Reaction options">
              <button role="menuitem" aria-label="Like" onClick={(e) => { e.stopPropagation(); onLike('like'); }} className="p-2 hover:bg-secondary rounded-full transition-transform hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none text-red-500" title="Like"><Heart className="h-5 w-5 fill-current" /></button>
              <button role="menuitem" aria-label="Celebrate" onClick={(e) => { e.stopPropagation(); onLike('celebrate'); }} className="p-2 hover:bg-secondary rounded-full transition-transform hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none text-green-500" title="Celebrate"><PartyPopper className="h-5 w-5 fill-current" /></button>
              <button role="menuitem" aria-label="Insightful" onClick={(e) => { e.stopPropagation(); onLike('insightful'); }} className="p-2 hover:bg-secondary rounded-full transition-transform hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none text-yellow-500" title="Insightful"><Lightbulb className="h-5 w-5 fill-current" /></button>
              <button role="menuitem" aria-label="Support" onClick={(e) => { e.stopPropagation(); onLike('support'); }} className="p-2 hover:bg-secondary rounded-full transition-transform hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none text-purple-500" title="Support"><HandHeart className="h-5 w-5 fill-current" /></button>
            </div>
          </div>
          
          <button 
            aria-label={`Toggle comments. ${post.comment_count} comments`}
            aria-expanded={showComments}
            className={`flex items-center gap-1.5 hover:text-primary transition-colors ${showComments ? 'text-primary' : ''}`} 
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            {post.comment_count}
          </button>

          {post.template_data?.type === 'event' && (
            <button 
              className="flex items-center gap-1.5 hover:text-primary transition-colors" 
              onClick={() => {
                const title = post.template_data?.event_title || "Community Event";
                const start = post.template_data?.event_date ? new Date(post.template_data.event_date) : new Date();
                
                const formatDate = (date: Date) => {
                  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                
                const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${formatDate(start)}\nDTEND:${formatDate(new Date(start.getTime() + 60 * 60 * 1000))}\nSUMMARY:${title}\nDESCRIPTION:${post.text}\nLOCATION:${post.template_data?.event_location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
              
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'event.ics';
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("Event downloaded to Calendar!");
              }}
              title="Add to Calendar"
              aria-label="Add to Calendar"
            >
              <Calendar className="h-4 w-4" />
            </button>
          )}
          
          <div className="ml-auto flex items-center gap-4">
            <button 
              className={`flex items-center gap-1.5 hover:text-primary transition-colors ${post.is_saved ? 'text-primary' : ''}`} 
              onClick={onSave}
              title={post.is_saved ? "Unsave" : "Save Post"}
              aria-label={post.is_saved ? "Unsave Post" : "Save Post"}
            >
              <Bookmark className={`h-4 w-4 ${post.is_saved ? 'fill-current' : ''}`} />
            </button>
            <button 
              className="flex items-center gap-1.5 hover:text-primary transition-colors" 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`);
                toast.success("Link copied to clipboard!");
              }}
              title="Share"
              aria-label="Share Post"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {showComments && <InlineComments postId={post.id!} currentUserId={currentUserId} onCommentAdded={onCommentOptimistic} />}
          </div>
        )}
      </CardContent>
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Please select a reason for reporting this post.</p>
            <div className="space-y-2">
              {['Spam', 'Offensive content', 'Other'].map(reason => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-primary"
                  />
                  {reason}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowReportDialog(false)} disabled={isReporting}>Cancel</Button>
              <Button variant="destructive" onClick={submitReport} disabled={isReporting}>
                {isReporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export const CommentNode = ({ comment, allComments, currentUserId, onReply, level = 0 }: { comment: any, allComments: any[], currentUserId?: string, onReply: (id: string, username: string) => void, level?: number }) => {
  const replies = allComments.filter(c => c.parent_id === comment.id || c.parent_id === comment._id);
  const isReply = level > 0;
  const [collapsed, setCollapsed] = useState(true);
  
  return (
    <div className={`flex gap-2 ${isReply ? 'mt-3' : ''}`}>
      <Avatar className="h-6 w-6 mt-0.5"><AvatarImage src={comment.author?.avatar_url || ""} /><AvatarFallback>{(comment.author?.full_name || "?")[0]}</AvatarFallback></Avatar>
      <div className="flex-1">
        <div className={`bg-background border p-2 rounded-lg rounded-tl-none`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold">{comment.author?.full_name || "Anonymous"}</span>
            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at || comment.createdAt || Date.now()), { addSuffix: true })}</span>
          </div>
          <p className="text-xs">{comment.text}</p>
        </div>
        <div className="flex gap-4 mt-1 ml-1 items-center">
          <button 
            className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
            onClick={() => onReply(comment.id || comment._id, comment.author?.username || comment.author?.full_name || "Anonymous")}
          >
            Reply
          </button>
          {replies.length > 0 && (
            <button 
              className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? `View ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}` : 'Hide replies'}
            </button>
          )}
        </div>
        
        {replies.length > 0 && !collapsed && (
          <div className="ml-2 border-l-2 border-border/50 pl-2 mt-2 space-y-3">
            {replies.map(r => (
              <CommentNode key={r.id || r._id} comment={r} allComments={allComments} currentUserId={currentUserId} onReply={onReply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InlineComments = ({ postId, currentUserId, onCommentAdded }: { postId: string; currentUserId?: string; onCommentAdded: () => void }) => {
  const { comments, loading, setComments } = usePostComments(postId);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);

  const submit = async () => {
    if(!text.trim()) return;
    setPosting(true);
    const r = await postComment(postId, text, replyingTo?.id);
    setPosting(false);
    if (r) {
      setComments((prev: any) => [{...r, id: r._id, created_at: r.createdAt}, ...prev]);
      setText("");
      setReplyingTo(null);
      onCommentAdded();
    }
  };

  const topLevelComments = comments.filter((c: any) => !c.parent_id);

  return (
    <div className="mt-4 pt-4 border-t bg-secondary/10 -mx-4 px-4 pb-2 rounded-b-xl">
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto my-4 text-muted-foreground" /> : comments.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-2">No comments yet. Be the first!</p>
        ) : topLevelComments.map((c: any) => (
          <CommentNode 
            key={c.id || c._id} 
            comment={c} 
            allComments={comments} 
            currentUserId={currentUserId} 
            onReply={(id, username) => {
              setReplyingTo({ id, username });
              setText(`@${username} `);
            }} 
          />
        ))}
      </div>
      
      {currentUserId ? (
        <div className="flex flex-col gap-2">
          {replyingTo && (
            <div className="flex items-center justify-between bg-primary/10 text-primary text-xs px-2 py-1 rounded-md mb-1 mx-9">
              <span>Replying to {replyingTo.username}</span>
              <button onClick={() => { setReplyingTo(null); setText(""); }} className="hover:text-primary-foreground bg-primary/20 rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <Avatar className="h-7 w-7"><AvatarFallback>You</AvatarFallback></Avatar>
            <div className="flex-1 relative">
              <Input 
                className="h-8 text-xs pr-8 bg-background" 
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."} 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && submit()}
                maxLength={1000} 
              />
              <button 
                className="absolute right-2 top-1.5 text-primary disabled:text-muted-foreground"
                disabled={posting || !text.trim()}
                onClick={submit}
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-center text-muted-foreground">Sign in to comment</p>
      )}
    </div>
  );
};

const ReactionListPopover = ({ postId, children }: { postId: string, children: React.ReactNode }) => {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchReactions = async () => {
    if (loaded || loading) return;
    setLoading(true);
    const data = await getPostReactions(postId);
    setReactions(data);
    setLoaded(true);
    setLoading(false);
  };

  return (
    <HoverCard onOpenChange={(open) => { if (open) fetchReactions(); }}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-56 p-3 z-50">
        <h4 className="font-semibold text-sm mb-2">Reactions</h4>
        {loading ? (
          <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : reactions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No reactions yet.</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {reactions.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={r.user?.avatar_url || ""} />
                  <AvatarFallback className="text-[9px]">{(r.user?.full_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium leading-none">{r.user?.full_name || r.user?.username || "Anonymous"}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{r.type}</span>
                </div>
              </div>
            ))}
            {reactions.length > 10 && (
              <p className="text-[10px] text-muted-foreground text-center">+{reactions.length - 10} more</p>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default Community;
