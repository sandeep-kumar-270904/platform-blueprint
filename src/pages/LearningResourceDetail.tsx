import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Star, ThumbsUp, Calendar, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

export const LearningResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [resource, setResource] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/learning-resources/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setResource(data.data);
          setReviews(data.reviews || []);
        } else {
          navigate('/learning-resources');
        }
      } catch (err) {
        console.error("Failed to load resource", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id, navigate]);

  if (loading) {
    return <div className="container mx-auto py-20 text-center">Loading resource...</div>;
  }

  if (!resource) {
    return <div className="container mx-auto py-20 text-center">Resource not found</div>;
  }

  const getYouTubeUrl = () => {
    if (resource.type === 'video') return `https://youtube.com/watch?v=${resource.youtubeId}`;
    if (resource.type === 'playlist') return `https://youtube.com/playlist?list=${resource.youtubeId}`;
    if (resource.type === 'channel') return `https://youtube.com/channel/${resource.youtubeId}`;
    return `https://youtube.com`;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl overflow-hidden bg-black aspect-video relative group">
            {resource.thumbnailUrl ? (
              <img 
                src={resource.thumbnailUrl.replace('default.jpg', 'maxresdefault.jpg')} 
                alt={resource.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">No Thumbnail</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                <ExternalLink className="w-8 h-8 text-white" />
              </div>
            </div>
            {/* Click overlay to open YouTube */}
            <a 
              href={getYouTubeUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 z-10"
              aria-label="Open on YouTube"
            />
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              <Badge>{resource.topic}</Badge>
              <Badge variant="secondary">{resource.difficulty}</Badge>
              <Badge variant="outline">{resource.type}</Badge>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{resource.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{resource.channelTitle}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {resource.views.toLocaleString()} views</span>
            </div>

            <Button className="w-full md:w-auto mb-8" size="lg" asChild>
              <a href={getYouTubeUrl()} target="_blank" rel="noopener noreferrer">
                Open on YouTube <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>

            <div className="bg-card border rounded-xl p-5 mb-8">
              <h3 className="font-semibold mb-2">Community Context</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {resource.recommendationReason || "No context provided."}
              </p>
              
              <div className="mt-4 pt-4 border-t flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resource.submitter?.avatar_url} />
                  <AvatarFallback>{resource.submitter?.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium leading-none mb-1">Submitted by {resource.submitter?.full_name || resource.submitter?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Reviews */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Community Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{resource.averageRating > 0 ? resource.averageRating : 'N/A'}</span>
                  <span className="text-xs text-muted-foreground">({resource.reviewCount})</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">Recommend Rate</span>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <span className="font-bold">{resource.recommendationRate}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                  {resource.tags && resource.tags.length > 0 ? (
                    resource.tags.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="font-semibold text-lg">Student Reviews ({reviews.length})</h3>
            {user && (
              <Button variant="outline" size="sm">Add Review</Button>
            )}
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center p-6 bg-muted/30 rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground mb-2">No reviews yet.</p>
                <p className="text-xs text-muted-foreground">Be the first to share your feedback after watching!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="p-4 bg-card border rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={review.user?.avatar_url} />
                        <AvatarFallback>{review.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{review.user?.username}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      {review.overall}
                    </div>
                  </div>
                  
                  {review.textReview && (
                    <p className="text-sm mt-3 text-foreground/90">{review.textReview}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {review.wouldRecommend && (
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-200">
                        Recommended
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      Difficulty: {review.difficulty}
                    </Badge>
                    {review.tags?.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
