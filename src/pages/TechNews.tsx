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
import { Newspaper, Clock, ExternalLink, Plus, Star, CheckCircle, XCircle, Trash2, Loader2, Search, Users, Bookmark, Share2, TrendingUp, Flame, Settings, Flag, MessageSquare, Sparkles, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useNews, useAdminNews, submitNewsArticle, updateNewsStatus, toggleFeatured, deleteNews,
  useTrendingNews, useSavedArticleIds, trackArticleView, toggleBookmark, updateNewsPreferences, useTrendingTags, useComments, submitComment, voteComment, reportComment, useCollections, createCollection, saveToCollection,
  useRelatedNews, reportArticle
} from "@/hooks/useNews";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useInView } from "react-intersection-observer";
import useEmblaCarousel from "embla-carousel-react";
import { ArticleCard } from "@/components/news/ArticleCard";
import { MorningBriefWidget } from "@/components/news/MorningBriefWidget";

const CATEGORIES = ['AI', 'Startups', 'Big Tech', 'Research', 'Gadgets'];
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800";

const TrendingCarousel = () => {
  const { articles, loading } = useTrendingNews();
  const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });

  if (loading) return <div className="h-40 animate-pulse bg-muted rounded-xl mb-12"></div>;
  if (!articles || articles.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold font-serif text-foreground">Trending Now</h2>
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

const TrendingTagsWidget = ({ onSelectTag }: { onSelectTag: (tag: string) => void }) => {
  const { tags, loading } = useTrendingTags();
  if (loading || tags.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4" /> Trending Topics
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
            onClick={() => onSelectTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

const TechNews = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [onboardingOpen, setOnboardingOpen] = useState(false);
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
  const [prefForm, setPrefForm] = useState({
    followedCategories: user?.newsPreferences?.followedCategories || [],
    preferredSources: user?.newsPreferences?.preferredSources || [],
    mutedSources: user?.newsPreferences?.mutedSources || [],
    digestFrequency: user?.newsPreferences?.digestFrequency || 'off'
  });

  useEffect(() => {
    if (user?.newsPreferences) {
      setPrefForm({
        followedCategories: user.newsPreferences.followedCategories || [],
        preferredSources: user.newsPreferences.preferredSources || [],
        mutedSources: user.newsPreferences.mutedSources || [],
        digestFrequency: user.newsPreferences.digestFrequency || 'off'
      });
    }
  }, [user]);

  const handleSavePrefs = async () => {
    try {
      await updateNewsPreferences({ 
        followedCategories: prefForm.followedCategories, 
        preferredSources: prefForm.preferredSources, 
        mutedSources: prefForm.mutedSources,
        digestFrequency: prefForm.digestFrequency,
        followedTags: [], mutedTags: [] 
      });
      toast.success("Preferences saved successfully!");
      setPrefsOpen(false);
      if (forYou) refetchLive(); // Reload feed
    } catch (err: any) {
      toast.error("Failed to save preferences: " + err.message);
    }
  };

  const toggleArrayItem = (key: keyof typeof prefForm, val: string) => {
    setPrefForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(i => i !== val) : [...prev[key], val]
    }));
  };


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
              <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl font-serif text-foreground leading-tight">
                AI & Tech News
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-xl text-foreground/70 font-medium">
                Real-time insights across AI, Startups, and Technology.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 items-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search articles, tags..." 
                    className="pl-10 h-12 rounded-full border-border bg-card shadow-sm text-foreground"
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
                  <Button variant={adminMode ? "default" : "outline"} size="lg" className="rounded-full h-12 bg-card text-foreground border-border" onClick={() => setAdminMode(!adminMode)}>
                    {adminMode ? "Exit Mod Mode" : "Mod Mode"}
                  </Button>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 flex-1 max-w-6xl">
        
        {!adminMode && !searchInput && (
          <>
            <MorningBriefWidget />
            <TrendingCarousel />
            <TrendingTagsWidget onSelectTag={(t) => { setSearchInput(t); setForYou(false); setActiveCategory('All'); }} />
          </>
        )}
        

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center border-b border-border pb-6">
          <div className="flex flex-wrap gap-2 justify-center flex-1">
            {!adminMode ? (
              <>
                <Badge 
                  variant={activeCategory === 'All' && !forYou ? 'default' : 'outline'} 
                  className={`cursor-pointer text-sm px-5 py-2 rounded-full transition-all ${activeCategory === 'All' && !forYou ? 'bg-black text-white' : 'bg-card text-foreground hover:bg-muted border-border'}`}
                  onClick={() => { setActiveCategory('All'); setForYou(false); }}
                >
                  All
                </Badge>
                {user && (
                  <Badge 
                    variant={forYou ? 'default' : 'outline'} 
                    className={`cursor-pointer text-sm px-5 py-2 rounded-full transition-all flex items-center gap-1 ${forYou ? 'bg-primary text-white border-primary' : 'bg-card text-primary border-primary/30 hover:bg-primary/5'}`}
                    onClick={() => { setForYou(true); setActiveCategory(''); }}
                  >
                    <Star className="h-3 w-3" /> For You
                  </Badge>
                )}
                {CATEGORIES.map(c => (
                  <Badge 
                    key={c}
                    variant={activeCategory === c && !forYou ? 'default' : 'outline'} 
                    className={`cursor-pointer text-sm px-5 py-2 rounded-full transition-all ${activeCategory === c && !forYou ? 'bg-black text-white' : 'bg-card text-foreground hover:bg-muted border-border'}`}
                    onClick={() => { setActiveCategory(c); setForYou(false); }}
                  >
                    {c}
                  </Badge>
                ))}
              </>
            ) : (
              <div className="flex gap-4 items-center bg-card border border-border p-2 rounded-full shadow-sm">
                <span className="text-sm font-semibold ml-4 text-foreground/70">Admin Filter:</span>
                {['all', 'pending', 'live', 'rejected'].map(s => (
                  <Badge 
                    key={s}
                    variant={adminStatusFilter === s ? 'default' : 'outline'} 
                    className={`cursor-pointer capitalize px-4 py-1.5 rounded-full ${adminStatusFilter === s ? 'bg-black text-white' : 'bg-transparent text-foreground border-none'}`}
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
                <div key={i} className="h-48 md:h-64 bg-muted animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-foreground/50 bg-card rounded-2xl border border-border shadow-sm">
              <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium text-foreground/70">No articles found.</p>
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
                  <Loader2 className="h-8 w-8 animate-spin text-foreground/30" />
                </div>
              )}
              
              {!adminMode && !hasMore && articles.length > 0 && (
                <div className="text-center pt-8 pb-12 text-foreground/40 font-medium">
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
