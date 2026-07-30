import { useState, useEffect } from "react";
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

import { ServiceCard } from "@/components/repair/ServiceCard";
import { ServiceCardSkeleton } from "@/components/repair/ServiceCardSkeleton";
import { EmptyState } from "@/components/repair/EmptyState";
import { SortOption, RepairCategory } from "@/lib/mockRepairData";
import { ServiceListing } from "@/types/repair";

const Repair = () => {
  const [selectedTab, setSelectedTab] = useState<RepairCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("top_rated");
  const [page, setPage] = useState(1);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const loadServices = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const currentPage = isLoadMore ? page : 1;
      
      const queryParams = new URLSearchParams({
        category: selectedTab,
        sort: sortBy,
        page: currentPage.toString(),
        limit: '6'
      });

      // If sorting by nearest, we need to pass coordinates. Let's pass a mock LA coordinate for now 
      // since the browser geolocation might be slow or blocked in this demo
      if (sortBy === 'nearest') {
        queryParams.append('lat', '34.0522');
        queryParams.append('lng', '-118.2437');
      }

      const res = await fetch(`${API_URL}/api/repair?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      
      const result = await res.json();
      
      if (isLoadMore) {
        setServices(prev => [...prev, ...result.data]);
      } else {
        setServices(result.data);
      }
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset page and reload on tab or sort change
  useEffect(() => {
    setPage(1);
    loadServices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, sortBy]);

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
        <Tabs 
          value={selectedTab} 
          onValueChange={(val) => setSelectedTab(val as RepairCategory)} 
          className="space-y-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 lg:grid-cols-6 overflow-x-auto h-auto p-1">
              <TabsTrigger value="all" className="py-2">All</TabsTrigger>
              <TabsTrigger value="electronics" className="py-2">Electronics</TabsTrigger>
              <TabsTrigger value="plumbing" className="py-2">Plumbing</TabsTrigger>
              <TabsTrigger value="electrical" className="py-2">Electrical</TabsTrigger>
              <TabsTrigger value="handyman" className="py-2 hidden lg:block">Handyman</TabsTrigger>
              <TabsTrigger value="cleaning" className="py-2 hidden lg:block">Cleaning</TabsTrigger>
            </TabsList>

            <div className="w-full md:w-auto min-w-[200px]">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top_rated">Top Rated</SelectItem>
                  <SelectItem value="nearest">Nearest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={selectedTab} className="mt-6 border-none p-0 outline-none">
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
                      <ServiceCard service={service} />
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
                          Loading...
                        </>
                      ) : (
                        "Load More Providers"
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
    </div>
  );
};

export default Repair;
