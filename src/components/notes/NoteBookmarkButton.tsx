import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoteBookmarkButtonProps {
  noteId: string;
  size?: "sm" | "icon";
  className?: string;
}

export const NoteBookmarkButton = ({ noteId, size = "icon", className }: NoteBookmarkButtonProps) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchBookmark = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/notes/${noteId}/bookmark`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookmarked(data.bookmarked);
        }
      } catch {}
    };
    fetchBookmark();
  }, [noteId, user]);

  const toggle = async () => {
    if (!user) { toast.error("Please sign in to bookmark notes"); return; }
    
    // Optimistic UI update
    const previousState = bookmarked;
    const newState = !bookmarked;
    setBookmarked(newState);
    
    if (newState) {
      toast.success("Note bookmarked!");
    } else {
      toast.success("Bookmark removed");
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notes/${noteId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to update");
      }
    } catch {
      // Revert optimistic update on failure
      setBookmarked(previousState);
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("h-6 w-6", className)}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark note"}
    >
      <Bookmark className={cn("h-3.5 w-3.5 transition-colors", bookmarked ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-muted-foreground")} aria-hidden="true" />
    </Button>
  );
};
