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
}

export const ReviewFormDialog = ({ collegeId, onSuccess }: ReviewFormDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    reviewText: "",
    pros: "",
    cons: "",
    courseStudied: "",
    yearOfStudy: ""
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
      const res = await fetch(`${API_URL}/api/colleges/${collegeId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, rating })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit review");
      
      toast.success("Review submitted successfully!");
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
        <Button>Write a Review</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
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
              <label className="text-sm font-medium">Review</label>
              <Textarea 
                required 
                placeholder="Share the details of your experience..." 
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
                {loading ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
