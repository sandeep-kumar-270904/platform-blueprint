import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter, PlayCircle, Star, ThumbsUp, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitResourceModal } from "@/components/learning-resources/SubmitResourceModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const LearningResources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { user } = useAuth();

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

  useEffect(() => {
    // Delay search slightly to debounce
    const delayDebounceFn = setTimeout(() => {
      fetchResources();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
          <p className="text-muted-foreground mt-1">
            Community-curated YouTube tutorials, channels, and playlists.
          </p>
        </div>
        
        {user && (
          <Button onClick={() => setShowSubmitModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Resource
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by topic, channel, or subject..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[320px] rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No resources found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Try adjusting your search terms, or be the first to submit a helpful YouTube resource for this topic!
          </p>
          {user && (
            <Button onClick={() => setShowSubmitModal(true)} variant="outline" className="mt-6">
              <Plus className="w-4 h-4 mr-2" /> Submit Resource
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => (
            <Link key={resource._id} to={`/learning-resources/${resource._id}`}>
              <Card className="h-full overflow-hidden hover:border-primary/50 transition-colors group">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {resource.thumbnailUrl ? (
                    <img 
                      src={resource.thumbnailUrl} 
                      alt={resource.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <PlayCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded">
                    {resource.type.toUpperCase()}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {resource.topic}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {resource.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                    {resource.channelTitle}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{resource.averageRating || 'New'}</span>
                      <span>({resource.reviewCount})</span>
                    </div>
                    {resource.recommendationRate > 0 && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {resource.recommendationRate}% Rec
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
