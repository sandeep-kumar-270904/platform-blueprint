import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SubmitReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  onSuccess: () => void;
}

const StarRating = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400/50"
            }`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );
};

export const SubmitReviewModal = ({ open, onOpenChange, resourceId, onSuccess }: SubmitReviewModalProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    overall: 5,
    explanation: 5,
    usefulness: 5,
    practicalValue: 5,
    difficulty: "Just Right",
    wouldRecommend: true,
    textReview: "",
    tags: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/learning-resources/${resourceId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setFormData({
        overall: 5,
        explanation: 5,
        usefulness: 5,
        practicalValue: 5,
        difficulty: "Just Right",
        wouldRecommend: true,
        textReview: "",
        tags: ""
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            Rate & Review Resource
          </DialogTitle>
          <DialogDescription>
            Your feedback helps the community find the best learning materials. 
            {user?.role === 'alumni' && " As an Alumni, your ratings carry more weight in the community algorithm!"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          
          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
            <StarRating label="Overall Rating" value={formData.overall} onChange={(v) => setFormData({...formData, overall: v})} />
            <StarRating label="Explanation Clarity" value={formData.explanation} onChange={(v) => setFormData({...formData, explanation: v})} />
            <StarRating label="Usefulness" value={formData.usefulness} onChange={(v) => setFormData({...formData, usefulness: v})} />
            <StarRating label="Practical Value" value={formData.practicalValue} onChange={(v) => setFormData({...formData, practicalValue: v})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={formData.difficulty || undefined} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Too Easy">Too Easy</SelectItem>
                  <SelectItem value="Just Right">Just Right</SelectItem>
                  <SelectItem value="Too Hard">Too Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox 
                id="recommend" 
                checked={formData.wouldRecommend} 
                onCheckedChange={(checked) => setFormData({...formData, wouldRecommend: checked === true})} 
              />
              <Label htmlFor="recommend" className="font-medium cursor-pointer">I recommend this</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Written Review (Optional)</Label>
            <Textarea 
              placeholder="What did you like about this? What could be better?" 
              value={formData.textReview}
              onChange={(e) => setFormData({...formData, textReview: e.target.value})}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Tags (Optional)</Label>
            <Input 
              placeholder="e.g. good-for-beginners, clear-audio" 
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">Comma separated</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
