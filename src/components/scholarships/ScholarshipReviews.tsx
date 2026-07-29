import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ScholarshipReviews = ({ scholarshipId, averageRating, reviewCount, hasApplication }: { scholarshipId: string, averageRating?: number, reviewCount?: number, hasApplication?: boolean }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [tipsForApplicants, setTipsForApplicants] = useState("");
  const [wasAwarded, setWasAwarded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Check if user has an existing review
  const existingReview = reviews.find(r => r.userId?._id === user?._id || r.userId === user?._id);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [scholarshipId]);

  useEffect(() => {
    if (existingReview) {
      setRating(String(existingReview.rating));
      setReviewText(existingReview.reviewText || "");
      setTipsForApplicants(existingReview.tipsForApplicants || "");
      setWasAwarded(existingReview.wasAwarded || false);
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    const url = existingReview 
        ? `${API_URL}/api/scholarships/${scholarshipId}/reviews/${existingReview._id}`
        : `${API_URL}/api/scholarships/${scholarshipId}/reviews`;
        
    const method = existingReview ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: Number(rating),
          reviewText,
          tipsForApplicants,
          wasAwarded
        })
      });
      if (res.ok) {
        toast.success(existingReview ? "Review updated!" : "Review submitted!");
        setIsModalOpen(false);
        fetchReviews();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reviewId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Review reported to moderators");
        fetchReviews(); // Re-fetch to see if it was auto-hidden
      }
    } catch (err) {
      toast.error("Failed to report review");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary/60" /></div>;

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Applicant Reviews</h3>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">{averageRating?.toFixed(1) || 0}</span>
            <span>({reviewCount || 0} reviews)</span>
          </div>
        </div>
        
        {user && hasApplication && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>{existingReview ? 'Edit your review' : 'Write a Review'}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{existingReview ? 'Edit Review' : 'Review Scholarship'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Experience</Label>
                  <Textarea 
                    required 
                    placeholder="What was the application process like?"
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tips for Future Applicants (Optional)</Label>
                  <Textarea 
                    placeholder="What do you wish you knew before applying?"
                    value={tipsForApplicants}
                    onChange={e => setTipsForApplicants(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="awarded" 
                    checked={wasAwarded} 
                    onCheckedChange={(c) => setWasAwarded(c as boolean)} 
                  />
                  <Label htmlFor="awarded">I was awarded this scholarship</Label>
                </div>
                
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map(review => (
            <Card key={review._id} className="bg-card">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                      ))}
                    </div>
                    {review.wasAwarded && <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full font-medium">Awarded</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleReport(review._id)} title="Report review">
                    <Flag className="h-3 w-3" />
                  </Button>
                </div>
                
                <p className="text-sm mt-2">{review.reviewText}</p>
                
                {review.tipsForApplicants && (
                  <div className="mt-3 bg-primary/5 border border-primary/20 rounded p-3">
                    <p className="text-xs font-bold text-primary mb-1">Tips for Applicants</p>
                    <p className="text-sm text-muted-foreground">{review.tipsForApplicants}</p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                  <span className="font-medium">{review.userId?.full_name || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
