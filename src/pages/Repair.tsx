import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, Layers, Heart, Send } from "lucide-react";
import { RepairFiltersSheet, RepairFilters } from "@/components/repair/RepairFiltersSheet";
import { CompareDrawer } from "@/components/repair/CompareDrawer";
import { ServiceCard } from "@/components/repair/ServiceCard";
import { ServiceCardSkeleton } from "@/components/repair/ServiceCardSkeleton";
import { EmptyState } from "@/components/repair/EmptyState";
import { ProviderDetailsSheet } from "@/components/repair/ProviderDetailsSheet";
import { ListServiceModal } from "@/components/repair/ListServiceModal";
import { RequestQuoteModal } from "@/components/repair/RequestQuoteModal";
import { SortOption, RepairCategory } from "@/lib/mockRepairData";
import { ServiceListing } from "@/types/repair";

const Repair = () => {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<RepairCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("top_rated");
  const [page, setPage] = useState(1);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<ServiceListing[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<RepairFilters>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Compare State
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // List Service State
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // URL query parameter effect to open provider sheet from shared link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const providerParam = params.get('provider');
    if (providerParam) {
      setSelectedProviderId(providerParam);
    }
  }, []);

  // Fetch Recommendations (Only for logged-in users, gracefully falls back if no token or error)
  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // Only fetch if user might be logged in

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/recommendations?locale=${i18n.language}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setRecommendations(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      }
    };

    // Defer fetching recommendations to avoid blocking main render on slow devices
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const loadServices = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const currentPage = isLoadMore ? page : 1;
      
      let endpoint = `${API_URL}/api/repair`;
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '6',
        locale: i18n.language
      });

      if (selectedTab === 'saved') {
        endpoint = `${API_URL}/api/repair/saved`;
      } else {
        queryParams.append('category', selectedTab);
        queryParams.append('sort', sortBy);

        if (debouncedSearch) queryParams.append('search', debouncedSearch);
        if (filters.minRating) queryParams.append('minRating', filters.minRating.toString());
        if (filters.priceMin) queryParams.append('priceMin', filters.priceMin.toString());
        if (filters.priceMax) queryParams.append('priceMax', filters.priceMax.toString());
        if (filters.openNow) {
          queryParams.append('openNow', 'true');
          const now = new Date();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          queryParams.append('currentDay', days[now.getDay()]);
          queryParams.append('currentTime', (now.getHours() * 60 + now.getMinutes()).toString());
        }

        if (sortBy === 'nearest') {
          queryParams.append('lat', '34.0522');
          queryParams.append('lng', '-118.2437');
        }
      }

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${endpoint}?${queryParams.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch services');
      
      const result = await res.json();
      
      if (isLoadMore) {
        setServices(prev => [...prev, ...result.data]);
      } else {
        setServices(result.data);
      }
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSaveToggle = (id: string, isSaved: boolean) => {
    // If we're on the saved tab and removing a save, remove it from the list
    if (selectedTab === 'saved' && !isSaved) {
      setServices(prev => prev.filter(s => s.id !== id));
      return;
    }

    // Otherwise just update the flag in both lists
    setServices(prev => prev.map(s => s.id === id ? { ...s, isSaved } : s));
    setRecommendations(prev => prev.map(s => s.id === id ? { ...s, isSaved } : s));
  };

  // Reset page and reload on tab, sort, search, or filter change
  useEffect(() => {
    setPage(1);
    loadServices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, sortBy, debouncedSearch, filters]);

  // Load more on page change
  useEffect(() => {
    if (page > 1) {
      loadServices(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleClearFilter = () => {
    setSelectedTab("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Wrench className="mr-1 h-3 w-3" />
                  Service Directory
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Repair &{" "}
                  <span className="text-foreground display-font">
                    Maintenance
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Find reliable repair services for electronics, plumbing, electrical work, and more.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, service, or specialty..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button variant="outline" className="shrink-0 gap-2" onClick={() => setIsFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(filters.priceMin || filters.priceMax || filters.minRating || filters.openNow) && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 flex items-center justify-center rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
          
          {/* Active Filter Chips */}
          {(filters.priceMin || filters.priceMax || filters.minRating || filters.openNow) && (
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span className="text-muted-foreground text-xs mr-1">Active Filters:</span>
              {filters.minRating && (
                <Badge variant="secondary" className="gap-1 font-normal">
                  {filters.minRating}+ Stars
                  <button aria-label="Remove minimum rating filter" onClick={() => setFilters(prev => ({ ...prev, minRating: undefined }))}>
                    <X className="h-3 w-3 cursor-pointer" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {(filters.priceMin || filters.priceMax) && (
                <Badge variant="secondary" className="gap-1 font-normal">
                  Price: {filters.priceMin ? `$${filters.priceMin}` : '$0'} - {filters.priceMax ? `$${filters.priceMax}` : 'Any'}
                  <button aria-label="Remove price filter" onClick={() => setFilters(prev => ({ ...prev, priceMin: undefined, priceMax: undefined }))}>
                    <X className="h-3 w-3 cursor-pointer" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {filters.openNow && (
                <Badge variant="secondary" className="gap-1 font-normal">
                  Open Now
                  <button aria-label="Remove open now filter" onClick={() => setFilters(prev => ({ ...prev, openNow: false }))}>
                    <X className="h-3 w-3 cursor-pointer" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" aria-label="Clear all active filters" className="h-6 text-xs text-muted-foreground min-h-[44px]" onClick={() => setFilters({})}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        <Tabs 
          value={selectedTab} 
          onValueChange={(val) => setSelectedTab(val as RepairCategory)} 
          className="space-y-8"
        >
          {/* Recommendations Section */}
          {recommendations.length > 0 && showRecommendations && (
            <div className="mb-8 p-6 bg-secondary/10 border border-secondary/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 h-11 w-11 text-muted-foreground hover:text-foreground"
                onClick={() => setShowRecommendations(false)}
                aria-label="Dismiss recommendations"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Recommended for you</h3>
              </div>
              <p className="text-muted-foreground mb-6 text-sm max-w-2xl">
                Based on your past service requests and saved providers, here are some highly-rated professionals you might find useful.
              </p>
              
              <div className="flex overflow-x-auto pb-4 gap-6 snap-x -mx-2 px-2">
                {recommendations.map(service => (
                  <div key={service.id} className="min-w-[300px] w-[300px] md:min-w-[350px] md:w-[350px] shrink-0 snap-start">
                    <ServiceCard 
                      service={service} 
                      onViewDetails={setSelectedProviderId}
                      onSaveToggle={handleSaveToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Get Quotes Banner */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full shrink-0">
                <Send className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Not sure who to hire? Get Multiple Quotes</h3>
                <p className="text-sm text-blue-200/70 mt-1 max-w-xl">
                  Describe your issue once and have it broadcast to multiple matching providers in your area. Compare price estimates and availability before making a decision.
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20"
              onClick={() => setIsQuoteModalOpen(true)}
            >
              Request Quotes
            </Button>
          </div>

          <div className="flex justify-end mb-6">
            <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
              <SelectTrigger className="h-11 w-full md:w-[180px] bg-background">
                <SelectValue placeholder={t('Sort by', 'Sort by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top_rated">{t('Top Rated', 'Top Rated')}</SelectItem>
                <SelectItem value="most_reviewed">{t('Most Reviewed', 'Most Reviewed')}</SelectItem>
                <SelectItem value="nearest">{t('Nearest to me', 'Nearest to me')}</SelectItem>
                <SelectItem value="price_low">{t('Price: Low to High', 'Price: Low to High')}</SelectItem>
                <SelectItem value="price_high">{t('Price: High to Low', 'Price: High to Low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={selectedTab} className="mt-0 border-none p-0 outline-none">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service, index) => (
                    <ScrollReveal key={service.id} delay={0.05 * (index % 6)}>
                      <ServiceCard 
                        service={service} 
                        onViewDetails={setSelectedProviderId}
                        isCompared={compareIds.includes(service.id)}
                        onSaveToggle={handleSaveToggle}
                        onToggleCompare={(id, checked) => {
                          if (checked) {
                            if (compareIds.length >= 3) return; // Prevent more than 3
                            setCompareIds(prev => [...prev, id]);
                          } else {
                            setCompareIds(prev => prev.filter(c => c !== id));
                          }
                        }}
                      />
                    </ScrollReveal>
                  ))}
                </div>
                
                {page < totalPages && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="min-w-[200px]"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('Loading...', 'Loading...')}
                        </>
                      ) : (
                        t('Load More Providers', 'Load More Providers')
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState category={selectedTab} onClearFilter={handleClearFilter} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Compare Floating Action Button */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in zoom-in duration-300">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg h-14 px-6 gap-2"
            onClick={() => setIsCompareOpen(true)}
          >
            <Layers className="h-5 w-5" />
            {t('Compare', 'Compare')} ({compareIds.length})
          </Button>
        </div>
      )}

      {/* List Your Service Footer CTA */}
      <div className="mt-16 mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl p-8 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{t('Are you a service provider?', 'Are you a service provider?')}</h3>
            <p className="text-blue-200/70 max-w-md">
              {t("Join our directory to connect with students and staff. We'll review your details and reach out to help you get listed.", "Join our directory to connect with students and staff. We'll review your details and reach out to help you get listed.")}
            </p>
          </div>
          <Button size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700" onClick={() => setIsListModalOpen(true)}>
            {t('List Your Service', 'List Your Service')}
          </Button>
        </div>
      </div>

      {/* Slide-out Sheets / Drawers */}
      <RepairFiltersSheet 
        open={isFiltersOpen} 
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onApplyFilters={setFilters}
      />

      <CompareDrawer 
        open={isCompareOpen}
        onOpenChange={setIsCompareOpen}
        providers={services.filter(s => compareIds.includes(s.id))}
        onRemove={(id) => setCompareIds(prev => prev.filter(c => c !== id))}
        onClear={() => {
          setCompareIds([]);
          setIsCompareOpen(false);
        }}
      />
      
      <ListServiceModal 
        open={isListModalOpen}
        onOpenChange={setIsListModalOpen}
      />

      <RequestQuoteModal 
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        defaultCategory={selectedTab !== 'all' && selectedTab !== 'saved' ? selectedTab : 'handyman'}
        onSuccess={() => {
          setTimeout(() => setIsQuoteModalOpen(false), 2000);
        }}
      />
      
      {/* Sheet for displaying Provider details */}
      <ProviderDetailsSheet 
        providerId={selectedProviderId} 
        onClose={() => {
          setSelectedProviderId(null);
          // Optional: clean up URL query params
          const url = new URL(window.location.href);
          url.searchParams.delete('provider');
          window.history.pushState({}, '', url);
        }} 
      />
    </div>
  );
};

export default Repair;
