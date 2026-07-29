import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ReviewFormDialogProps {
  collegeId: string;
  onSuccess: () => void;
  review?: any;
  trigger?: React.ReactNode;
}

export const ReviewFormDialog = ({ collegeId, onSuccess, review, trigger }: ReviewFormDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(review?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    title: review?.title || "",
    reviewText: review?.reviewText || "",
    pros: review?.pros || "",
    cons: review?.cons || "",
    courseStudied: review?.courseStudied || "",
    yearOfStudy: review?.yearOfStudy || ""
  });
  const [categoryRatings, setCategoryRatings] = useState({
    hostel: review?.categoryRatings?.hostel || 0,
    labs: review?.categoryRatings?.labs || 0,
    faculty: review?.categoryRatings?.faculty || 0,
    campusLife: review?.categoryRatings?.campusLife || 0,
    placements: review?.categoryRatings?.placements || 0,
    academics: review?.categoryRatings?.academics || 0,
    infrastructure: review?.categoryRatings?.infrastructure || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      
      const url = review 
        ? `${API_URL}/api/reviews/${review._id}`
        : `${API_URL}/api/colleges/${collegeId}/reviews`;
        
      const method = review ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, rating, categoryRatings })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || (review ? "Failed to update review" : "Failed to submit review"));
      
      toast.success(review ? "Review updated successfully!" : "Review submitted successfully!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button>Write a Review</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{review ? "Edit Review" : "Write a Review"}</DialogTitle>
        </DialogHeader>
        
        {!user ? (
          <div className="text-center py-6">
            <p className="mb-4 text-muted-foreground">You must be logged in to write a review.</p>
            {/* Can link to auth page here if desired */}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="flex flex-col items-center justify-center space-y-2 mb-6">
              <span className="text-sm font-medium">Your Rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        (hoverRating || rating) >= star 
                          ? "fill-warning text-warning" 
                          : "text-muted-foreground opacity-30"
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-border/50 pt-4 pb-2">
              <span className="text-sm font-medium">Rate Specific Aspects</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'academics', label: 'Academics' },
                  { key: 'faculty', label: 'Faculty' },
                  { key: 'infrastructure', label: 'Infrastructure' },
                  { key: 'placements', label: 'Placements' },
                  { key: 'campusLife', label: 'Campus Life' },
                  { key: 'hostel', label: 'Hostel' },
                  { key: 'labs', label: 'Labs' }
                ].map((cat) => (
                  <div key={cat.key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{cat.label}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-0.5 transition-transform hover:scale-110"
                          onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.key]: star }))}
                        >
                          <Star 
                            className={`h-4 w-4 ${
                              (categoryRatings as any)[cat.key] >= star 
                                ? "fill-warning text-warning" 
                                : "text-muted-foreground opacity-30"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                required 
                placeholder="Summary of your experience" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Review</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-200"
                  onClick={async () => {
                    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
                    const token = localStorage.getItem("token");
                    if (!token) return toast.error("Please login first");
                    toast.loading("Polishing with AI...", { id: "ai-polish" });
                    try {
                      const res = await fetch(`${API_URL}/api/ai/review-helper`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ bulletPoints: formData.reviewText, pros: formData.pros, cons: formData.cons })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setFormData({ ...formData, reviewText: data.reviewText });
                        toast.success("AI Polish complete!", { id: "ai-polish" });
                      } else {
                        throw new Error(data.message || "Failed to polish review");
                      }
                    } catch (error: any) {
                      toast.error(error.message, { id: "ai-polish" });
                    }
                  }}
                >
                  <Star className="h-3 w-3 mr-1 text-blue-500" />
                  Magic AI Polish
                </Button>
              </div>
              <Textarea 
                required 
                placeholder="Share the details of your experience... (Or write bullet points and use Magic AI Polish)" 
                className="min-h-[100px]"
                value={formData.reviewText}
                onChange={(e) => setFormData({...formData, reviewText: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pros (Optional)</label>
                <Input 
                  placeholder="What was good?" 
                  value={formData.pros}
                  onChange={(e) => setFormData({...formData, pros: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cons (Optional)</label>
                <Input 
                  placeholder="What could be better?" 
                  value={formData.cons}
                  onChange={(e) => setFormData({...formData, cons: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Studied (Optional)</label>
                <Input 
                  placeholder="e.g. B.Tech CS" 
                  value={formData.courseStudied}
                  onChange={(e) => setFormData({...formData, courseStudied: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Year (Optional)</label>
                <Input 
                  placeholder="e.g. 2023" 
                  value={formData.yearOfStudy}
                  onChange={(e) => setFormData({...formData, yearOfStudy: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (review ? "Updating..." : "Submitting...") : (review ? "Update Review" : "Submit Review")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
