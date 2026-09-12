import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, ThumbsUp, Youtube, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitResourceModal } from "@/components/learning-resources/SubmitResourceModal";
import { useAuth } from "@/hooks/useAuth";

export const TechnologyPage = () => {
  const { technologySlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [techName, setTechName] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // 1. Fetch Taxonomy to resolve slug to name
        const taxRes = await fetch(`${API_URL}/api/taxonomy`);
        const taxData = await taxRes.json();
        
        if (taxData.success) {
          const tech = taxData.flat.find((t: any) => t.slug === technologySlug);
          if (tech) {
            setTechName(tech.name);
            
            // 2. Fetch Resources for this technology
            const resRes = await fetch(`${API_URL}/api/learning-resources?technology=${encodeURIComponent(tech.name)}`);
            const resData = await resRes.json();
            if (resData.success) {
              setResources(resData.data);
            }
          } else {
            navigate('/learning-resources'); // fallback if tech not found
          }
        }
      } catch (err) {
        console.error("Failed to load tech page", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [technologySlug, navigate]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate('/learning-resources')} className="mb-6 -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discover
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{techName} Learning Resources</h1>
          <p className="text-muted-foreground text-lg">
            Master {techName} with community-vetted videos, playlists, and channels.
          </p>
        </div>
        {user && (
          <Button onClick={() => setShowSubmitModal(true)} className="mt-4 md:mt-0">
            Submit {techName} Resource
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar for Sub-filters (mocked for now, can be populated from taxonomy) */}
        <div className="w-full md:w-64 space-y-6 shrink-0">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Level</p>
              <div className="flex flex-col gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                  <Badge key={l} variant="outline" className="justify-start py-1.5 px-3 font-normal cursor-pointer hover:bg-secondary">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3">Intent</p>
            <div className="flex flex-col gap-2">
              {['Placement Preparation', 'Interview Preparation', 'Project Development', 'Deep dive'].map(p => (
                <Badge key={p} variant="secondary" className="justify-start py-1.5 px-3 font-normal cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-[280px] rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
              <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <h3 className="text-lg font-medium">No resources yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Be the first to add a {techName} resource!</p>
              {user && <Button onClick={() => setShowSubmitModal(true)} variant="outline" size="sm">Add Resource</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <div key={resource._id} className="cursor-pointer" onClick={() => navigate(`/learning-resources/${resource._id}`)}>
                  <Card className="h-full overflow-hidden hover:border-primary/50 transition-all hover:shadow-md group">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img 
                        src={resource.thumbnailUrl} 
                        alt={resource.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-4 flex flex-col h-[calc(100%-56.25%)]">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <Badge variant="secondary" className="text-[10px] font-medium">{resource.topic}</Badge>
                        <Badge variant="outline" className="text-[10px]">{resource.difficulty}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors flex-grow">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                        {resource.channelTitle}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t mt-auto">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-foreground">{resource.averageRating || 'New'}</span>
                        </div>
                        {resource.recommendationRate > 0 && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <ThumbsUp className="w-3.5 h-3.5" /> {resource.recommendationRate}%
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSubmitModal && (
        <SubmitResourceModal 
          open={showSubmitModal} 
          onOpenChange={setShowSubmitModal}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};
