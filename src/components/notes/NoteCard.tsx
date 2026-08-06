import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NoteBookmarkButton } from "./NoteBookmarkButton";
import { Star, Eye, Download, Pencil, Trash2 } from "lucide-react";
import { formatStat } from "@/lib/utils";

interface NoteCardProps {
  note: any;
  index: number;
  isOwner?: boolean;
  onDetail: (note: any) => void;
  onPreview: (note: any) => void;
  onAI: (note: any) => void;
  onSession: (note: any) => void;
  onEdit?: (note: any) => void;
  onDelete?: (note: any) => void;
}

export const NoteCard = ({
  note,
  index,
  isOwner = false,
  onDetail,
  onPreview,
  onEdit,
  onDelete,
}: NoteCardProps) => (
  <ScrollReveal delay={index * 0.03} direction="scale">
    <Card 
      className="relative card-hover overflow-hidden transition-all duration-200 ease-out bg-card text-card-foreground border-border hover:-translate-y-1 hover:shadow-md active:scale-[0.99] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 group h-full flex flex-col cursor-pointer min-h-[260px] dark:bg-white/[0.02] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-primary/50"
      onClick={() => onPreview(note)}
    >
      {/* Dog-ear fold detail */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-transparent via-transparent to-border dark:to-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

      <CardHeader className="p-4 pb-2 relative z-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-8">
            <h3
              className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors"
              title={note.title || "Untitled note"}
            >
              {note.title || "Untitled note"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {note.subject ? <span className="font-medium">Course:</span> : ""} {note.subject}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 absolute right-4 top-4">
            {note.file_type && (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline-flex">
                {note.file_type}
              </Badge>
            )}
            <NoteBookmarkButton noteId={note.id} aria-label="Bookmark this note" />
            {isOwner && (
              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md absolute right-0 top-8">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit?.(note); }} aria-label="Edit note">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete?.(note); }} aria-label="Delete note">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-3 flex-1 flex flex-col">
        {note.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3" title={note.description}>{note.description}</p>
        )}
        
        <div className="flex flex-wrap gap-1.5 mb-3 mt-auto pt-2 max-h-[50px] overflow-hidden relative">
          {note.semester && <Badge variant="secondary" className="text-[10px] font-medium">Sem {note.semester}</Badge>}
          {note.branch && <Badge variant="secondary" className="text-[10px] font-medium">{note.branch}</Badge>}
          {note.university && <Badge variant="secondary" className="text-[10px] font-medium">{note.university}</Badge>}
          
          {(() => {
            const validTags = (note.tags || []).filter((t: string) => t && t.trim() !== "");
            const displayTags = validTags.slice(0, 3);
            const remaining = validTags.length - 3;
            
            return (
              <>
                {displayTags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] font-medium bg-secondary/60 hover:bg-secondary/80">{tag}</Badge>
                ))}
                {remaining > 0 && (
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">+{remaining} more</Badge>
                )}
              </>
            );
          })()}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/60 mt-auto">
          <div className="flex items-center gap-1.5 font-medium" title="Community rating">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" aria-hidden="true" />
            <span className={Number(note.rating) > 0 ? "text-foreground" : ""}>
              {Number(note.rating) > 0 ? formatStat(note.rating, true, "", true) : "No ratings"}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Total page views">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatStat(note.views, true)}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Total downloads">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatStat(note.downloads, true)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-3 pb-3 pt-3 border-t border-border/60 bg-muted/10">
        <div className="flex w-full gap-2 justify-between items-center">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background shadow-sm border border-transparent hover:border-border transition-all" onClick={(e) => { e.stopPropagation(); onPreview(note); }} aria-label="Preview note">
            Preview
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 transition-colors" onClick={(e) => { e.stopPropagation(); onDetail(note); }}>
            Rate & Comment
          </Button>
        </div>
      </CardFooter>
    </Card>
  </ScrollReveal>
);
