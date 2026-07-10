import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteRatingProps {
  noteId: string;
  currentRating: number;
  compact?: boolean;
  onRated?: () => void;
}

export const NoteRating = ({ noteId, currentRating, compact = false, onRated }: NoteRatingProps) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [avgRating, setAvgRating] = useState(currentRating);

  useEffect(() => {
    loadRatingData();
  }, [noteId, user]);

  const loadRatingData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/api/notes/${noteId}/ratings`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTotalRatings(data.totalRatings || 0);
        setAvgRating(data.avgRating || currentRating);
        if (data.userRating) setUserRating(data.userRating);
      }
    } catch {}
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast.error("Please sign in to rate notes");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notes/${noteId}/ratings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      if (res.ok) {
        setUserRating(rating);
        toast.success(`Rated ${rating} star${rating > 1 ? "s" : ""}!`);
        loadRatingData();
        onRated?.();
      } else {
        toast.error("Failed to submit rating");
      }
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star className={cn(
              "h-4 w-4 transition-colors",
              (hoverRating || userRating) >= star
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            )} />
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-1">({avgRating.toFixed(1)})</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 hover:scale-125 transition-transform"
            >
              <Star className={cn(
                "h-5 w-5 transition-colors",
                (hoverRating || userRating) >= star
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              )} />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({totalRatings} rating{totalRatings !== 1 ? "s" : ""})</span>
      </div>
      {userRating > 0 && (
        <p className="text-xs text-muted-foreground">Your rating: {userRating}/5</p>
      )}
    </div>
  );
};
