import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Award, Search, X, ArrowLeft } from "lucide-react";
import { CollegeCard } from "@/components/colleges/CollegeCard";
import { SkeletonCollegeCard } from "@/components/colleges/SkeletonCollegeCard";
import { CollegeRecommenderDialog } from "@/components/colleges/CollegeRecommenderDialog";
import { Personalization } from "@/components/colleges/Personalization";
import { useColleges } from "@/hooks/useColleges";
import debounce from "lodash/debounce";
import { CompareBar } from "@/components/colleges/CompareBar";
import { AddCollegeDialog } from "@/components/colleges/AddCollegeDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

const CollegeInsights = () => {
  const { user } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [totalColleges, setTotalColleges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [savedCollegeIds, setSavedCollegeIds] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<any[]>([]);
  
  // AI State
  const [aiResults, setAiResults] = useState<any>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const {
    filters,
    setSearch, setType, setFeeRange, setRatingMin, setLocation, setSort,
    getColleges, getSavedColleges
  } = useColleges();

  const [localSearch, setLocalSearch] = useState(filters.search);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce search input
  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    debouncedSetSearch(e.target.value);
    setPage(1);
  };

  const loadColleges = async (pageNum: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      const data = await getColleges(pageNum);
      if (isLoadMore) {
        setColleges(prev => [...prev, ...data.colleges]);
      } else {
        setColleges(data.colleges);
      }
      setTotalColleges(data.total || data.colleges.length);
      setHasMore(pageNum < data.pages);
    } catch (error) {
      console.error("Failed to fetch colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSaved = async () => {
    try {
      const saved = await getSavedColleges();
      setSavedCollegeIds(new Set(saved.map((c: any) => c._id || c)));
    } catch (error) {
      console.error("Failed to load saved colleges", error);
    }
  };

  useEffect(() => {
    loadColleges(1);
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (user) {
      loadSaved();
    }
    const stored = sessionStorage.getItem("compareList");
    if (stored) {
      try { setCompareList(JSON.parse(stored)); } catch(e){}
    }
  }, [user]);

  const handleToggleCompare = (college: any) => {
    setCompareList(prev => {
      const exists = prev.find(c => c._id === college._id);
      let newList;
      if (exists) {
        newList = prev.filter(c => c._id !== college._id);
      } else {
        if (prev.length >= 20) {
          import("sonner").then(({ toast }) => toast.error("Maximum 20 colleges allowed for comparison"));
          return prev;
        }
        newList = [...prev, college];
      }
      sessionStorage.setItem("compareList", JSON.stringify(newList));
      return newList;
    });
  };

  const handleRemoveCompare = (id: string) => {
    setCompareList(prev => {
      const newList = prev.filter(c => c._id !== id);
      sessionStorage.setItem("compareList", JSON.stringify(newList));
      return newList;
    });
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSearch("");
    setType("All");
    setFeeRange("");
    setRatingMin("");
    setLocation("All");
    setSort("rating");
  };

  const hasActiveFilters = localSearch || filters.type !== "All" || filters.feeRange !== "" || filters.ratingMin !== "" || filters.sort !== "rating";

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden pt-0 pb-8 -mt-2">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-8">
            <ScrollReveal direction="down">
              <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
                
                {/* Main Headline with letter-by-letter typing and delayed looping float */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <motion.h1 
                    className="mb-6 text-3xl font-bold tracking-tight md:text-5xl"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.08 } }
                    }}
                  >
                    {"Find Your Dream College".split("").map((char, index) => (
                      <motion.span
                        key={index}
                        className={`inline-block ${index >= 10 ? 'text-foreground display-font' : ''}`}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </motion.h1>
                </motion.div>

                {/* Subtitle with natural wrapping and standard vertical spacing */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                  className="w-full"
                >
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    Compare colleges, read verified reviews, and make informed decisions about your future.
                  </p>
                </motion.div>

              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {aiResults ? (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-6 rounded-xl border border-border">
              <div>
                <h2 className="text-2xl font-bold">AI Recommendations</h2>
                <p className="text-muted-foreground">
                  Showing matches for <strong>{aiResults.course}</strong> under <strong>₹{(parseInt(aiResults.budget) / 100000).toFixed(1)}L/yr</strong>
                </p>
              </div>
              <Button variant="outline" onClick={() => setAiResults(null)} className="gap-2 shrink-0">
                <ArrowLeft className="h-4 w-4" /> Back to All Colleges
              </Button>
            </div>

            {/* Reach, Target, Safe Sections */}
            {[
              { title: "Reach Options", data: aiResults.reach, color: "text-red-500", desc: "Highly competitive based on your profile" },
              { title: "Target Matches", data: aiResults.target, color: "text-amber-500", desc: "Great alignments with your scores and goals" },
              { title: "Safe Bets", data: aiResults.safe, color: "text-green-500", desc: "High probability of admission" }
            ].map((section) => section.data && section.data.length > 0 && (
              <div key={section.title} className="space-y-4">
                <div className="flex items-end justify-between border-b pb-2">
                  <div>
                    <h3 className={`text-xl font-bold ${section.color}`}>{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.desc}</p>
                  </div>
                  <Badge variant="secondary">{section.data.length} colleges</Badge>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 pt-4">
                  {section.data.map((college: any) => (
                    <CollegeCard 
                      key={college._id} 
                      college={college} 
                      isSaved={savedCollegeIds.has(college._id)}
                      isCompared={compareList.some(c => c._id === college._id)}
                      onToggleCompare={handleToggleCompare}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {aiResults.reach.length === 0 && aiResults.target.length === 0 && aiResults.safe.length === 0 && (
              <div className="text-center py-24 border border-dashed rounded-xl border-border bg-muted/10">
                <h3 className="text-xl font-medium mb-2">No strict AI matches found</h3>
                <p className="text-muted-foreground mb-6">We couldn't find colleges perfectly matching those specific parameters.</p>
                <Button onClick={() => setAiResults(null)}>Back to All Colleges</Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Personalization />
            <ScrollReveal delay={0.1}>
              <div className="mb-8 flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 border-b border-border/50 pb-4">
                  
                  {/* Left: Search Bar */}
                  <div className="relative w-full xl:w-[380px] shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for colleges..."
                      value={localSearch}
                      onChange={handleSearchChange}
                      className="pl-10 h-12 text-md bg-background"
                    />
                    {localSearch && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleSearchChange({ target: { value: '' } } as any)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Right: Filters and Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-3 flex-1 w-full">
                    <Select value={filters.type} onValueChange={setType}>
                      <SelectTrigger className={`w-[140px] h-11 ${filters.type !== 'All' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Institution Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="IIT">IIT</SelectItem>
                        <SelectItem value="NIT">NIT</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="State">State/Central</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.ratingMin} onValueChange={setRatingMin}>
                      <SelectTrigger className={`w-[140px] h-11 ${filters.ratingMin !== '' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Min Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Rating</SelectItem>
                        <SelectItem value="4.5">4.5 & Above</SelectItem>
                        <SelectItem value="4.0">4.0 & Above</SelectItem>
                        <SelectItem value="3.5">3.5 & Above</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.feeRange} onValueChange={setFeeRange}>
                      <SelectTrigger className={`w-[150px] h-11 ${filters.feeRange !== '' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Fee Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Fee</SelectItem>
                        <SelectItem value="0-100000">Under 1 Lakh</SelectItem>
                        <SelectItem value="100000-200000">1 - 2 Lakhs</SelectItem>
                        <SelectItem value="200000+">Above 2 Lakhs</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.sort} onValueChange={setSort}>
                      <SelectTrigger className={`w-[150px] h-11 ${filters.sort !== 'rating' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="fees-low">Lowest Fees</SelectItem>
                        <SelectItem value="fees-high">Highest Fees</SelectItem>
                        <SelectItem value="name">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {hasActiveFilters && (
                      <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-11">
                        Clear Filters
                      </Button>
                    )}
                    <CollegeRecommenderDialog 
                      open={aiModalOpen} 
                      onOpenChange={setAiModalOpen} 
                      onSuccess={(data) => setAiResults(data)} 
                    />
                    {user?.role === 'admin' && (
                      <AddCollegeDialog onSuccess={() => { loadColleges(1); setPage(1); }} />
                    )}
                  </div>
                </div>

                <div className="text-sm font-medium text-muted-foreground">
                  {!loading && `Showing ${colleges.length} of ${totalColleges} college${totalColleges !== 1 ? 's' : ''}`}
                </div>
              </div>
            </ScrollReveal>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <SkeletonCollegeCard key={n} />
                ))}
              </div>
            ) : colleges.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {colleges.map((college, index) => (
                    <ScrollReveal key={college._id} delay={0.05 * (index % 6)}>
                      <CollegeCard 
                        college={college} 
                        isSaved={savedCollegeIds.has(college._id)}
                        isCompared={compareList.some(c => c._id === college._id)}
                        onToggleCompare={handleToggleCompare}
                      />
                    </ScrollReveal>
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        loadColleges(nextPage, true);
                      }}
                    >
                      Load More Colleges
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 border border-dashed rounded-xl border-border bg-muted/10">
                <h3 className="text-xl font-medium mb-2">No colleges found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filters, or check back later.</p>
                <div className="flex justify-center gap-4">
                  {hasActiveFilters && <Button onClick={clearFilters}>Clear All Filters</Button>}
                  {user?.role === 'admin' && (
                    <AddCollegeDialog onSuccess={() => { loadColleges(1); setPage(1); }} />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {compareList.length > 0 && (
        <CompareBar colleges={compareList} onRemove={handleRemoveCompare} />
      )}
    </div>
  );
};

export default CollegeInsights;
