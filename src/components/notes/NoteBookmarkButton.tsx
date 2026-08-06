import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoteBookmarkButtonProps {
  noteId: string;
  isBookmarked: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: "sm" | "icon";
  className?: string;
}

export const NoteBookmarkButton = ({ 
  isBookmarked, 
  onToggle, 
  size = "icon", 
  className 
}: NoteBookmarkButtonProps) => {
  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("h-6 w-6", className)}
      onClick={onToggle}
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark note"}
    >
      <Bookmark className={cn("h-3.5 w-3.5 transition-colors", isBookmarked ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-muted-foreground")} aria-hidden="true" />
    </Button>
  );
};
