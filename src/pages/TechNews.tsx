import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Clock, ExternalLink, Plus, Star, CheckCircle, XCircle, Trash2, Loader2, Search, Users, Bookmark, Share2, TrendingUp, Flame, Settings, Flag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useNews, useAdminNews, submitNewsArticle, updateNewsStatus, toggleFeatured, deleteNews,
  useTrendingNews, useSavedArticleIds, trackArticleView, toggleBookmark, updateNewsPreferences,
  useRelatedNews, reportArticle
} from "@/hooks/useNews";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useInView } from "react-intersection-observer";
import useEmblaCarousel from "embla-carousel-react";

const CATEGORIES = ['AI', 'Startups', 'Big Tech', 'Research', 'Gadgets'];
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800";

const TrendingCarousel = () => {
  const { articles, loading } = useTrendingNews();
  const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });

  if (loading) return <div className="h-40 animate-pulse bg-black/5 rounded-xl mb-12"></div>;
  if (!articles || articles.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold font-serif text-black">Trending Now</h2>
      </div>
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex gap-4">
          {articles.map(article => (
            <a 
              key={article._id} 
              href={article.sourceLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => trackArticleView(article._id)}
              className="relative flex-none w-[280px] h-[160px] md:w-[320px] rounded-xl overflow-hidden group cursor-pointer"
            >
              <img src={article.imageUrl || DEFAULT_IMAGE} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-white text-[10px] px-2 py-0 h-4 mb-2">HOT</Badge>
                <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                <div className="flex items-center text-white/60 text-xs mt-2 gap-2">
                  <span>{article.sourceName}</span>
                  <span className="flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> {article.viewCount} views</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArticleCard = ({ article, isAdminMode, savedIds, toggleLocalSavedId, onAdminAction }: any) => {
  const isSaved = savedIds.has(article._id);
  const [showRelated, setShowRelated] = useState(false);
  const { articles: relatedArticles, loading: relatedLoading } = useRelatedNews(showRelated ? article._id : null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reporting, setReporting] = useState(false);

  const handleReport = async () => {
    setReporting(true);
    try {
      await reportArticle(article._id, reportReason);
      toast.success("Article reported successfully");
      setReportOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to report article");
    } finally {
      setReporting(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(article.sourceLink);
    toast.success("Link copied to clipboard!");
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Optimistic
      toggleLocalSavedId(article._id, !isSaved);
      await toggleBookmark(article._id);
      toast.success(!isSaved ? "Saved to your bookmarks" : "Removed from bookmarks");
    } catch (err: any) {
      toggleLocalSavedId(article._id, isSaved); // Revert
      toast.error(err.message || "Failed to toggle bookmark");
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border-black/5 ${article.isFeatured ? 'ring-2 ring-black' : ''} ${article.isNew ? 'animate-in fade-in slide-in-from-top-4 duration-500' : ''}`}>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
          <img 
            src={article.imageUrl || DEFAULT_IMAGE} 
            alt={article.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          {article.isFeatured && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center">
              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
            </div>
          )}
        </div>
        
        <div className="md:w-2/3 flex flex-col p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2 items-center flex-wrap">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold">
                {article.category}
              </Badge>
              {article.tags?.slice(0, 2).map((t: string) => (
                <Badge key={t} variant="outline" className="text-xs text-black/50 border-black/10">{t}</Badge>
              ))}
              
              {article.submissionType === 'user_submitted' && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  <Users className="h-3 w-3 mr-1" /> Community
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleShare} className="text-black/40 hover:text-black transition-colors p-1" title="Copy Link">
                <Share2 className="h-4 w-4" />
              </button>
              <button onClick={handleBookmark} className="text-black/40 hover:text-primary transition-colors p-1" title="Bookmark">
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
              </button>
              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <button className="text-black/40 hover:text-destructive transition-colors p-1" title="Report Article">
                    <Flag className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Article</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">Why are you reporting this article?</p>
                    <Select value={reportReason} onValueChange={setReportReason}>
                      <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="broken_link">Broken Link</SelectItem>
                        <SelectItem value="misleading">Misleading/Fake News</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReport} disabled={reporting}>
                      {reporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <a href={article.sourceLink} target="_blank" rel="noopener noreferrer" onClick={() => trackArticleView(article._id)}>
            <h3 className="text-xl md:text-2xl font-bold font-serif leading-tight mb-3 hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-black/60 line-clamp-2 mb-6 flex-1 text-sm md:text-base">
              {article.summary}
            </p>
          </a>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
            <div className="flex items-center gap-3 text-sm font-medium text-black/50">
              <span className="text-black/80 font-bold">{article.sourceName}</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1.5 opacity-70" />
                {formatDistanceToNow(new Date(article.publishedAt))} ago
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={() => setShowRelated(!showRelated)} className="text-xs text-black/50 hover:text-black underline-offset-4 hover:underline">
                {showRelated ? 'Hide Related' : 'Related'}
              </button>
              <a href={article.sourceLink} target="_blank" rel="noopener noreferrer" onClick={() => trackArticleView(article._id)} className="text-primary font-semibold text-sm hover:underline flex items-center">
                Read <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Related Articles Dropdown */}
          {showRelated && (
            <div className="mt-4 pt-4 border-t border-black/5 animate-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-black/40 uppercase mb-3">Related Articles</h4>
              {relatedLoading ? (
                <div className="flex gap-2"><Loader2 className="h-4 w-4 animate-spin text-black/30" /> <span className="text-xs text-black/40">Loading...</span></div>
              ) : relatedArticles.length === 0 ? (
                <div className="text-xs text-black/40">No related articles found.</div>
              ) : (
                <div className="space-y-3">
                  {relatedArticles.map((rel: any) => (
                    <a key={rel._id} href={rel.sourceLink} target="_blank" rel="noopener noreferrer" onClick={() => trackArticleView(rel._id)} className="group flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-black/5 overflow-hidden flex-shrink-0">
                        <img src={rel.imageUrl || DEFAULT_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{rel.title}</p>
                        <p className="text-xs text-black/50">{rel.sourceName}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdminMode && (
            <div className="mt-4 pt-4 border-t border-dashed flex gap-2 w-full">
              {article.status !== 'live' && (
                <Button size="sm" variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'status', 'live'); }}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
              )}
              {article.status !== 'rejected' && (
                <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'status', 'rejected'); }}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              )}
              <Button size="sm" variant={article.isFeatured ? "default" : "outline"} onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'feature', !article.isFeatured); }}>
                <Star className={`h-4 w-4 ${article.isFeatured ? 'fill-current' : ''}`} />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'delete'); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const TechNews = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [forYou, setForYou] = useState(false);
  
  const [adminMode, setAdminMode] = useState(false);
  const [adminStatusFilter, setAdminStatusFilter] = useState('pending');

  const { savedIds, toggleLocalSavedId } = useSavedArticleIds(user?.id);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { 
    articles: liveArticles, 
    loading: liveLoading, 
    loadingMore,
    hasMore,
    loadMore,
    refetch: refetchLive 
  } = useNews(activeCategory, [], forYou, debouncedSearch);

  const { articles: adminArticles, loading: adminLoading, refetch: refetchAdmin } = useAdminNews(adminStatusFilter);

  const articles = adminMode ? adminArticles : liveArticles;
  const loading = adminMode ? adminLoading : liveLoading;

  // Infinite Scroll Observer
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
  useEffect(() => {
    if (inView && !loading && !adminMode) {
      loadMore();
    }
  }, [inView, loading, adminMode, loadMore]);

  // Submission State
  const [submitOpen, setSubmitOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', summary: '', sourceLink: '', sourceName: '', category: '', imageUrl: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  // Prefs State
  const [prefsOpen, setPrefsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.summary || !formData.sourceLink || !formData.category) {
      return toast.error('Please fill in required fields');
    }
    setSubmitting(true);
    try {
      await submitNewsArticle(formData);
      toast.success(isAdmin ? 'Article published successfully' : 'Article submitted for review');
      setSubmitOpen(false);
      setFormData({ title: '', summary: '', sourceLink: '', sourceName: '', category: '', imageUrl: '', tags: '' });
      if (adminMode) refetchAdmin(); else refetchLive();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminAction = async (id: string, action: string, value?: any) => {
    try {
      if (action === 'status') await updateNewsStatus(id, value);
      if (action === 'feature') await toggleFeatured(id, value);
      if (action === 'delete') {
        if (!confirm('Delete this article?')) return;
        await deleteNews(id);
      }
      toast.success(`Action successful`);
      refetchAdmin();
      refetchLive();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F7F1' }}>
      <Header />

      <section className="relative pt-24 pb-12 overflow-hidden border-b border-border/10">
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="down">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="outline" className="mb-6 bg-black text-white hover:bg-black/90 border-0 px-4 py-1 font-semibold tracking-wide">
                <Newspaper className="mr-2 h-4 w-4" />
                Latest Updates
              </Badge>
              <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl font-serif text-black leading-tight">
                AI & Tech News
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-xl text-black/70 font-medium">
                Real-time insights across AI, Startups, and Technology.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 items-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search articles, tags..." 
                    className="pl-10 h-12 rounded-full border-black/20 bg-white shadow-sm text-black"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                
                {user && (
                  <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="rounded-full h-12 shadow-sm"><Plus className="mr-2 h-5 w-5" /> Submit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit News Article</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        <Textarea placeholder="Short Summary" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                        <Input placeholder="Source URL" value={formData.sourceLink} onChange={e => setFormData({...formData, sourceLink: e.target.value})} />
                        <Input placeholder="Source Name (e.g. TechCrunch)" value={formData.sourceName} onChange={e => setFormData({...formData, sourceName: e.target.value})} />
                        <Input placeholder="Image URL (Optional)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                        <Input placeholder="Tags (comma separated)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                        <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                          <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {isAdmin && (
                  <Button variant={adminMode ? "default" : "outline"} size="lg" className="rounded-full h-12 bg-white text-black border-black/20" onClick={() => setAdminMode(!adminMode)}>
                    {adminMode ? "Exit Mod Mode" : "Mod Mode"}
                  </Button>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 flex-1 max-w-6xl">
        {!adminMode && !searchInput && <TrendingCarousel />}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center border-b border-black/5 pb-6">
          <div className="flex flex-wrap gap-2 justify-center flex-1">
            {!adminMode ? (
              <>
                <Badge 
                  variant={activeCategory === 'All' && !forYou ? 'default' : 'outline'} 
                  className={`cursor-pointer text-sm px-5 py-2 rounded-full transition-all ${activeCategory === 'All' && !forYou ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5 border-black/20'}`}
                  onClick={() => { setActiveCategory('All'); setForYou(false); }}
                >
                  All
                </Badge>
                {user && (
                  <Badge 
                    variant={forYou ? 'default' : 'outline'} 
                    className={`cursor-pointer text-sm px-5 py-2 rounded-full transition-all flex items-center gap-1 ${forYou ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary/30 hover:bg-primary/5'}`}
                    onClick={() => { setForYou(true); setActiveCategory(''); }}
                  >
                    <Star className="h-3 w-3" /> For You
                  </Badge>
                )}
                {CATEGORIES.map(c => (
                  <Badge 
                    key={c}
                    variant={activeCategory === c && !forYou ? 'default' : 'outline'} 
                    className={`cursor-pointer text-sm px-5 py-2 rounded-full transition-all ${activeCategory === c && !forYou ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5 border-black/20'}`}
                    onClick={() => { setActiveCategory(c); setForYou(false); }}
                  >
                    {c}
                  </Badge>
                ))}
              </>
            ) : (
              <div className="flex gap-4 items-center bg-white border border-black/10 p-2 rounded-full shadow-sm">
                <span className="text-sm font-semibold ml-4 text-black/70">Admin Filter:</span>
                {['all', 'pending', 'live', 'rejected'].map(s => (
                  <Badge 
                    key={s}
                    variant={adminStatusFilter === s ? 'default' : 'outline'} 
                    className={`cursor-pointer capitalize px-4 py-1.5 rounded-full ${adminStatusFilter === s ? 'bg-black text-white' : 'bg-transparent text-black border-none'}`}
                    onClick={() => setAdminStatusFilter(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feed */}
        <div className="max-w-4xl mx-auto space-y-8">
          {loading && articles.length === 0 ? (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 md:h-64 bg-black/5 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-black/50 bg-white rounded-2xl border border-black/5 shadow-sm">
              <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium text-black/70">No articles found.</p>
              {forYou && <p className="text-sm mt-2">Try updating your preferences or saving more topics.</p>}
            </div>
          ) : (
            <>
              {articles.map((article: any, index: number) => (
                <ScrollReveal key={article._id || index} delay={0.05 * Math.min(index, 5)}>
                  <ArticleCard 
                    article={article} 
                    isAdminMode={adminMode} 
                    onAdminAction={handleAdminAction} 
                    savedIds={savedIds}
                    toggleLocalSavedId={toggleLocalSavedId}
                  />
                </ScrollReveal>
              ))}
              
              {/* Infinite Scroll Observer Target */}
              {!adminMode && hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-black/30" />
                </div>
              )}
              
              {!adminMode && !hasMore && articles.length > 0 && (
                <div className="text-center pt-8 pb-12 text-black/40 font-medium">
                  You've reached the end of the feed.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechNews;
