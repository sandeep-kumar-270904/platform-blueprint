import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DollarSign, Calendar, CheckCircle2, Search, Filter, Loader2, BookmarkPlus, BookmarkCheck, ArrowRight, Sparkles, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScholarships, Scholarship } from "@/hooks/useScholarships";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Scholarships = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Filters
  const [minAmount, setMinAmount] = useState<string>("all");
  const [academicLevel, setAcademicLevel] = useState<string>("all");
  const [applicationMode, setApplicationMode] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters = {
    q: debouncedSearch,
    minAmount: minAmount === "all" ? "" : minAmount,
    academicLevel: academicLevel === "all" ? "" : academicLevel,
    applicationMode: applicationMode === "all" ? "" : applicationMode,
    page,
    limit: 9
  };

  const { scholarships, total, loading, toggleSave, getMatchExplanation } = useScholarships(filters);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Handle save toggle
  const handleSave = async (id: string) => {
    const isSaved = await toggleSave(id);
    if (isSaved !== undefined) {
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinAmount("all");
    setAcademicLevel("all");
    setApplicationMode("all");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-primary/10 to-background border-b border-border/40">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <div className="flex justify-center items-center gap-3 mb-6">
                  <Badge variant="accent" className="px-3 py-1 text-sm font-medium">
                    <DollarSign className="mr-1 h-4 w-4" />
                    Financial Aid
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => navigate('/scholarships/my-scholarships')} className="rounded-full h-7 text-xs border-primary/20 hover:bg-primary/5">
                    <BookmarkCheck className="mr-1 h-3 w-3" /> My Scholarships
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/scholarships/calculator')} className="rounded-full h-7 text-xs border-primary/20 hover:bg-primary/5">
                    <Calculator className="mr-1 h-3 w-3" /> Calculator
                  </Button>
                </div>
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl text-foreground">
                  Find Your{" "}
                  <span className="text-primary bg-clip-text">
                    Scholarship
                  </span>
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Discover financial aid opportunities curated for your academic journey.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <div className="w-full lg:w-1/4 space-y-6">
            <Card className="sticky top-24 border-border/50 shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    Clear all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Title, provider, tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Minimum Amount</label>
                  <Select value={minAmount} onValueChange={setMinAmount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any amount</SelectItem>
                      <SelectItem value="1000">$1,000+</SelectItem>
                      <SelectItem value="5000">$5,000+</SelectItem>
                      <SelectItem value="10000">$10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Academic Level</label>
                  <Select value={academicLevel} onValueChange={setAcademicLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any level</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Application Mode</label>
                  <Select value={applicationMode} onValueChange={setApplicationMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any mode</SelectItem>
                      <SelectItem value="in_app">Apply on StudentHub</SelectItem>
                      <SelectItem value="external_link">Apply Externally</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Results Grid */}
          <div className="flex-1 space-y-6">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                {loading ? "Searching..." : `${total} Scholarships found`}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
              </div>
            ) : scholarships.length === 0 ? (
              <div className="text-center py-24 px-4 bg-muted/30 rounded-2xl border border-dashed border-border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No scholarships found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We couldn't find any scholarships matching your current filters. Try adjusting your criteria or clearing filters.
                </p>
                <Button onClick={clearFilters} variant="outline">Clear all filters</Button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
                  {scholarships.map((scholarship, index) => (
                    <ScrollReveal key={scholarship._id} delay={0.05 * (index % 6)}>
                      <Card className="h-full flex flex-col hover:border-primary/50 transition-colors bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={scholarship.applicationMode === 'in_app' ? 'default' : 'secondary'} className="capitalize">
                              {scholarship.applicationMode.replace('_', ' ')}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 -mt-2 -mr-2 text-muted-foreground hover:text-primary"
                              onClick={() => handleSave(scholarship._id)}
                            >
                              {savedIds.has(scholarship._id) ? 
                                <BookmarkCheck className="h-5 w-5 text-primary" /> : 
                                <BookmarkPlus className="h-5 w-5" />
                              }
                            </Button>
                          </div>
                          <h3 className="text-lg font-bold leading-tight mb-1">{scholarship.title}</h3>
                          <p className="text-sm text-muted-foreground">{scholarship.provider}</p>
                        </CardHeader>
                        
                        <CardContent className="flex-1 space-y-4">
                          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <DollarSign className="h-5 w-5 text-primary" />
                            {scholarship.amountType === 'fixed' ? scholarship.amount.min?.toLocaleString() : 
                             scholarship.amountType === 'range' ? `${scholarship.amount.min?.toLocaleString()} - ${scholarship.amount.max?.toLocaleString()}` : 
                             scholarship.amountType === 'full_tuition' ? 'Full Tuition' : 'Varies'}
                          </div>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Deadline: {format(new Date(scholarship.applicationDeadline), 'MMM d, yyyy')}</span>
                            </div>
                            
                            {/* Tags preview */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {scholarship.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-muted rounded-full text-xs text-foreground/80">
                                  {tag}
                                </span>
                              ))}
                              {scholarship.tags.length > 3 && (
                                <span className="px-2 py-0.5 bg-muted rounded-full text-xs text-foreground/80">
                                  +{scholarship.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-4 border-t border-border/50">
                          <Button 
                            className="w-full gap-2 group" 
                            variant="default"
                            onClick={() => navigate(`/scholarships/${scholarship._id}`)}
                          >
                            View Details 
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Pagination */}
                {total > filters.limit && (
                  <div className="flex justify-center gap-2 pt-8">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-4 text-sm font-medium">
                      Page {page} of {Math.ceil(total / filters.limit)}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(total / filters.limit)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scholarships;
