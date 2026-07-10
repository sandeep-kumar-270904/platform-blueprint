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
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notes/${noteId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
        if (data.bookmarked) {
          toast.success("Note bookmarked!");
        } else {
          toast.success("Bookmark removed");
        }
      }
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("h-7 w-7", className)}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      disabled={loading}
    >
      <Bookmark className={cn("h-3.5 w-3.5 transition-colors", bookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
    </Button>
  );
};
