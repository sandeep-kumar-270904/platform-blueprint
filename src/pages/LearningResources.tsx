import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Filter, PlayCircle, Star, ThumbsUp, Youtube, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitResourceModal } from "@/components/learning-resources/SubmitResourceModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const LearningResources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchResources = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      
      const res = await fetch(`${API_URL}/api/learning-resources?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResources(data.data);
      }
    } catch (err) {
      console.error("Failed to load resources", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxonomies = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/taxonomy`);
      const data = await res.json();
      if (data.success) {
        // Sort by some arbitrary popularity for the pills, or just take first 10
        setTaxonomies(data.flat.slice(0, 12));
      }
    } catch (err) {
      console.error("Failed to load taxonomies", err);
    }
  };

  useEffect(() => {
    fetchTaxonomies();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResources();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-7xl flex-1">
        
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6 border-b pb-4 mt-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 min-w-max">
            <LayoutGrid className="w-6 h-6 text-primary" />
            {search ? "Search Results" : "🔥 Community Picks"}
          </h2>
          
          <div className="flex flex-1 items-center justify-end gap-3 w-full">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search topic or skill..." 
                className="pl-9 bg-card shadow-sm h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex h-9">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
            {user && (
              <Button size="sm" className="h-9" onClick={() => setShowSubmitModal(true)}>
                <Plus className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Submit Resource</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar for Popular Technologies */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card border rounded-xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground tracking-wider mb-4">Popular Technologies</p>
              <div className="flex flex-wrap gap-2">
                {taxonomies.map(tech => (
                  <Button 
                    key={tech.slug} 
                    variant="secondary" 
                    size="sm"
                    className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => navigate(`/learning-resources/tech/${tech.slug}`)}
                  >
                    {tech.name}
                  </Button>
                ))}
                {user && (
                  <Button variant="outline" size="sm" className="rounded-full border-dashed text-xs" onClick={() => setShowSubmitModal(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add New
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-[320px] rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border shadow-sm">
          <Youtube className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-semibold">No resources found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Try adjusting your search terms, or be the first to submit a helpful YouTube resource for this topic!
          </p>
          {user && (
            <Button onClick={() => setShowSubmitModal(true)} className="mt-6 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Submit Resource
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {resources.map((resource) => (
            <Link key={resource._id} to={`/learning-resources/${resource._id}`}>
              <Card className="h-full overflow-hidden hover:border-primary/50 transition-all hover:shadow-md group">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {resource.thumbnailUrl ? (
                    <img 
                      src={resource.thumbnailUrl} 
                      alt={resource.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <PlayCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider">
                    {resource.type.toUpperCase()}
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col h-[calc(100%-56.25%)]">
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <Badge variant="default" className="text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20">
                      {resource.technology || resource.subject}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {resource.topic}
                    </Badge>
                    {resource.purpose && (
                      <Badge variant="outline" className="text-[10px] font-medium border-dashed">
                        {resource.purpose}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors flex-grow">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-4 mt-1">
                    {resource.channelTitle}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-foreground">{resource.averageRating || 'New'}</span>
                      <span>({resource.reviewCount})</span>
                    </div>
                    {resource.recommendationRate > 0 && (
                      <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md">
                        <ThumbsUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-400 font-bold">
                          {resource.recommendationRate}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>

      {showSubmitModal && (
        <SubmitResourceModal 
          open={showSubmitModal} 
          onOpenChange={setShowSubmitModal}
          onSuccess={fetchResources}
        />
      )}
    </div>
  );
};
