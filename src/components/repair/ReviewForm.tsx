import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Star } from "lucide-react";

interface ReviewFormProps {
  providerId: string;
  onReviewSubmitted: (review: any) => void;
  existingReview?: any;
}

export function ReviewForm({ providerId, onReviewSubmitted, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (comment.trim().length < 5) {
      toast({
        title: "Comment too short",
        description: "Please provide a little more detail in your review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const isEdit = !!existingReview;
      const url = isEdit 
        ? `${API_URL}/api/repair/reviews/${existingReview.id || existingReview._id}`
        : `${API_URL}/api/repair/${providerId}/reviews`;
        
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rating, comment })
      });

      if (!response.ok) throw new Error("Failed to submit review");

      const result = await response.json();
      
      // Optimistic update
      // Since the backend might not populate userId immediately on creation, we mock it for the UI
      const newReview = {
        ...result.data,
        id: result.data._id,
        userId: existingReview?.userId || {
          _id: "me",
          username: "You",
          full_name: "Current User"
        }
      };

      onReviewSubmitted(newReview);
      setRating(0);
      setComment("");
      toast({
        title: existingReview ? "Review updated!" : "Review submitted!",
        description: "Thank you for your feedback.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Submission failed",
        description: "You must be logged in to leave a review.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
      <h4 className="font-semibold">{existingReview ? "Edit your review" : "Leave a review"}</h4>
      
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Share your experience with this service provider..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="bg-gray-800/50 border-gray-700 min-h-[100px]"
      />

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  );
}
