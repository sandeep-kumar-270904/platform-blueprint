import { useState, useEffect } from "react";
import { RepairReview } from "@/types/repair";
import { ReviewForm } from "./ReviewForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface ProviderReviewsProps {
  providerId: string;
  averageRating: number;
  totalReviews: number;
}

export function ProviderReviews({ providerId, averageRating, totalReviews }: ProviderReviewsProps) {
  const [reviews, setReviews] = useState<RepairReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Mocking the current logged in user (in a real app, get from auth context)
  const currentUserId = "mock_user_123"; 
  const userReview = reviews.find(r => typeof r.userId === 'object' ? r.userId._id === currentUserId : r.userId === currentUserId);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/${providerId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [providerId]);

  const handleReviewSubmitted = (newReview: RepairReview) => {
    // If updating, replace. If new, prepend.
    setReviews(prev => {
      const exists = prev.findIndex(r => r.id === newReview.id);
      if (exists !== -1) {
        const copy = [...prev];
        copy[exists] = newReview;
        return copy;
      }
      return [newReview, ...prev];
    });
  };

  const markHelpful = async (reviewId: string) => {
    // Optimistic UI
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r));
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/api/repair/reviews/${reviewId}/helpful`, {
        method: 'PUT',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
    } catch {
      // Silently revert if needed, but for UX keep it simple
    }
  };

  const flagReview = async (reviewId: string) => {
    toast({ title: "Review flagged", description: "This review has been reported to moderation." });
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/api/repair/reviews/${reviewId}/flag`, {
        method: 'PUT',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
    } catch {}
  };

  const deleteReview = async (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId && (r as any)._id !== reviewId));
    toast({ title: "Review deleted", description: "Your review has been successfully deleted." });
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/api/repair/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
    } catch {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    }
  };

  // Calculate distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = Math.round(r.rating) as keyof typeof distribution;
    if (distribution[star] !== undefined) distribution[star]++;
  });

  return (
    <div className="space-y-8 mt-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Ratings & Reviews</h3>
        
        {/* Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center justify-center p-6 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="text-5xl font-bold text-white mb-2">{averageRating.toFixed(1)}</div>
            <div className="flex text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-current" : "text-gray-700"}`} />
              ))}
            </div>
            <p className="text-gray-400 text-sm">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
          </div>

          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as keyof typeof distribution];
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center text-sm">
                  <span className="w-12 text-gray-400">{star} stars</span>
                  <Progress value={percentage} className="h-2 mx-3 flex-1" />
                  <span className="w-8 text-right text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <ReviewForm 
          providerId={providerId} 
          onReviewSubmitted={handleReviewSubmitted} 
          existingReview={userReview} 
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-gray-500 py-8 bg-gray-900/20 rounded-lg border border-gray-800 border-dashed">
            No reviews yet. Be the first to leave a review!
          </div>
        ) : (
          reviews.map(review => {
            const user = typeof review.userId === 'object' ? review.userId : { username: 'Anonymous', full_name: 'Anonymous' };
            const date = new Date(review.createdAt);
            
            return (
              <div key={review.id} className="p-4 rounded-xl bg-gray-900/30 border border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border border-gray-700">
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{user.full_name || user.username}</div>
                      <div className="text-xs text-gray-500">
                        {isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-700"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-3 mb-4">{review.comment}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <button 
                    onClick={() => markHelpful(review.id || (review as any)._id)} 
                    className="flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({review.helpfulCount || 0})</span>
                  </button>
                  {user._id === currentUserId || user.id === currentUserId || user === currentUserId ? (
                    <button 
                      onClick={() => deleteReview(review.id || (review as any)._id)}
                      className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                    >
                      <span>Delete</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => flagReview(review.id || (review as any)._id)}
                      className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
