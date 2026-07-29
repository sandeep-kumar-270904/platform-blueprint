import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Plus, Building2, SearchX, MessageSquare, Heart, Map as MapIcon, LayoutGrid } from "lucide-react";
import { useHostels, Hostel } from "@/hooks/useHostels";
import { HostelCard } from "@/components/hostels/HostelCard";
import { HostelsMapView } from "@/components/hostels/HostelsMapView";
import { HostelFormModal } from "@/components/hostels/HostelFormModal";
import { HostelDetailModal } from "@/components/hostels/HostelDetailModal";
import { HostelFilters, FilterState, defaultFilters } from "@/components/hostels/HostelFilters";
import { MyHostelsList } from "@/components/hostels/MyHostelsList";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import useDebounce from "@/hooks/useDebounce";

const Hostels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [selectedEditHostel, setSelectedEditHostel] = useState<Hostel | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const debouncedFilters = useDebounce(filters, 300);

  const { data: hostels, isLoading } = useHostels(debouncedFilters);
  
  const handleAddClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to list a hostel.",
      });
      return;
    }
    setFormOpen(true);
  };

  const hasActiveFilters = debouncedFilters.search || debouncedFilters.minPrice || debouncedFilters.maxPrice || debouncedFilters.type !== "all" || debouncedFilters.amenities.length > 0 || debouncedFilters.roomTypes.length > 0;
  
  // We determine if there are zero hostels globally vs zero matching filters
  // If filters are active and hostels is empty, it's a search miss.
  // If filters are empty and hostels is empty, the DB is empty.
  const hasListings = hostels && hostels.length > 0;
  const showEmptyState = !hasListings && !hasActiveFilters;
  const showNoMatches = !hasListings && hasActiveFilters;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Home className="mr-1 h-3 w-3" />
                  Accommodation
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Student{" "}
                  <span className="text-foreground display-font">
                    Hostels
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Find safe, affordable, and comfortable hostel accommodations near your campus.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 max-w-5xl mx-auto gap-4">
          <div>
            <h2 className="text-2xl font-bold">Available Hostels</h2>
            <p className="text-muted-foreground">Discover verified listings around campus</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-secondary/50 p-1 rounded-lg flex border border-border">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                className="h-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="mr-2 h-4 w-4" /> Grid
              </Button>
              <Button 
                variant={viewMode === "map" ? "default" : "ghost"} 
                size="sm"
                className="h-8"
                onClick={() => setViewMode("map")}
              >
                <MapIcon className="mr-2 h-4 w-4" /> Map
              </Button>
            </div>
            
            {user && (
              <>
                <Button variant="outline" onClick={() => navigate("/hostels/saved")}>
                  <Heart className="mr-2 h-4 w-4" /> Saved
                </Button>
                <Button variant="outline" onClick={() => navigate("/hostels/inquiries")}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Inquiries
                </Button>
              </>
            )}
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Hostel
            </Button>
          </div>
        </div>

        {hasListings && <HostelFilters filters={filters} setFilters={setFilters} />}
        {hasActiveFilters && !hasListings && <HostelFilters filters={filters} setFilters={setFilters} />}

        {user ? (
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="all">All Hostels</TabsTrigger>
                <TabsTrigger value="my">My Hostels</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : showEmptyState ? (
                <div className="max-w-5xl mx-auto text-center py-24 bg-secondary/20 rounded-xl border border-border/50">
                  <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">No hostels listed yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Be the first to list a student hostel and help students find their next home away from home.
                  </p>
                  <Button onClick={handleAddClick} variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add a Hostel
                  </Button>
                </div>
              ) : showNoMatches ? (
                <div className="max-w-5xl mx-auto text-center py-24 bg-secondary/20 rounded-xl border border-border/50">
                  <SearchX className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">No hostels match your search</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Try adjusting your filters, expanding your price range, or clearing your search criteria.
                  </p>
                  <Button onClick={() => setFilters(defaultFilters)} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in duration-300">
                  {hostels?.map((hostel: Hostel, index: number) => (
                    <ScrollReveal key={hostel._id} delay={0.1 * (index + 1)}>
                      <HostelCard 
                        hostel={hostel} 
                        onClick={() => setSelectedHostel(hostel)} 
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                  <HostelsMapView hostels={hostels || []} onSelectHostel={setSelectedHostel} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <MyHostelsList onEdit={(hostel) => {
                setSelectedEditHostel(hostel);
                setFormOpen(true);
              }} />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : showEmptyState ? (
              <div className="max-w-5xl mx-auto text-center py-24 bg-secondary/20 rounded-xl border border-border/50">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No hostels listed yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Be the first to list a student hostel and help students find their next home away from home.
                </p>
                <Button onClick={handleAddClick} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add a Hostel
                </Button>
              </div>
            ) : showNoMatches ? (
              <div className="max-w-5xl mx-auto text-center py-24 bg-secondary/20 rounded-xl border border-border/50">
                <SearchX className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No hostels match your search</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Try adjusting your filters, expanding your price range, or clearing your search criteria.
                </p>
                <Button onClick={() => setFilters(defaultFilters)} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in duration-300">
                {hostels?.map((hostel: Hostel, index: number) => (
                  <ScrollReveal key={hostel._id} delay={0.1 * (index + 1)}>
                    <HostelCard 
                      hostel={hostel} 
                      onClick={() => setSelectedHostel(hostel)} 
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                <HostelsMapView hostels={hostels || []} onSelectHostel={setSelectedHostel} />
              </div>
            )}
          </>
        )}
      </div>

      <HostelFormModal 
        open={formOpen} 
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedEditHostel(null);
        }} 
        hostelToEdit={selectedEditHostel}
      />
      <HostelDetailModal 
        hostel={selectedHostel} 
        open={!!selectedHostel} 
        onOpenChange={(open) => !open && setSelectedHostel(null)} 
      />
    </div>
  );
};

export default Hostels;
