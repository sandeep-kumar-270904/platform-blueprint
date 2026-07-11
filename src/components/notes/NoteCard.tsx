import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NoteBookmarkButton } from "./NoteBookmarkButton";
import { Star, Eye, Download, Sparkles, Users, Pencil, Trash2 } from "lucide-react";
import { formatStat, cn } from "@/lib/utils";

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
  onAI,
  onSession,
  onEdit,
  onDelete,
}: NoteCardProps) => (
  <ScrollReveal delay={index * 0.03} direction="scale">
    <Card 
      className="relative card-hover overflow-hidden transition-all duration-150 ease-out bg-[var(--color-surface-dark)] text-[var(--color-text-inverse)] border-[var(--color-border-dark)] hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-2 group h-full flex flex-col cursor-pointer"
      onClick={() => onPreview(note)}
    >
      {/* Dog-ear fold detail */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-transparent via-transparent to-[var(--color-border)] dark:to-[var(--color-border-dark)] opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

      <CardHeader className="p-[20px] pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <h3
              className="note-card-title line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors"
            >
              {note.title || "Untitled note"}
            </h3>
            <p className="mt-1 caption-meta">{note.subject}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {note.file_type && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "chip-label uppercase text-white",
                  note.file_type.toLowerCase() === 'pdf' ? 'bg-red-500 hover:bg-red-600' :
                  note.file_type.toLowerCase() === 'docx' ? 'bg-blue-500 hover:bg-blue-600' :
                  note.file_type.toLowerCase() === 'ppt' ? 'bg-orange-500 hover:bg-orange-600' :
                  ['png', 'jpg', 'jpeg'].includes(note.file_type.toLowerCase()) ? 'bg-green-500 hover:bg-green-600' :
                  'bg-gray-500 hover:bg-gray-600'
                )}
              >
                {note.file_type}
              </Badge>
            )}
            <NoteBookmarkButton noteId={note.id} aria-label="Bookmark this note" />
            {isOwner && (
              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit?.(note); }} aria-label="Edit note">
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(note); }} aria-label="Delete note">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-[20px] pb-[20px] flex-1 flex flex-col gap-[12px]">
        {note.description && (
          <p className="note-card-body line-clamp-2" title={note.description}>{note.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {note.semester && <Badge variant="secondary" className="chip-label">Sem {note.semester}</Badge>}
          {note.branch && <Badge variant="outline" className="chip-label text-[var(--color-text-inverse-muted)] border-[var(--color-border-dark)]">{note.branch}</Badge>}
          {note.university && <Badge variant="outline" className="chip-label text-[var(--color-text-inverse-muted)] border-[var(--color-border-dark)]">{note.university}</Badge>}
          {note.tags?.filter((t: string) => t && t.trim() !== "").slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="chip-label">{tag}</Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-4 caption-meta pt-2 border-t border-[var(--color-border-dark)]">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-[var(--color-warning)] text-[var(--color-warning)]" aria-hidden="true" />
            <span>{Number(note.rating) > 0 ? formatStat(note.rating, true, "", true) : "No ratings yet"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatStat(note.views, true)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatStat(note.downloads, true)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-[20px] pb-[20px] pt-0">
        <div className="flex w-full gap-1.5">
          <Button variant="link" size="sm" className="button-label px-0 text-[var(--color-text-inverse-muted)] hover:text-white" onClick={(e) => { e.stopPropagation(); onPreview(note); }} aria-label="Preview note">
            Preview
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="button-label text-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10" onClick={(e) => { e.stopPropagation(); onDetail(note); }}>
            Rate & Comment
          </Button>
        </div>
      </CardFooter>
    </Card>
  </ScrollReveal>
);
