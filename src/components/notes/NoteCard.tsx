import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NoteBookmarkButton } from "./NoteBookmarkButton";
import { Star, Eye, Download, Sparkles, Users, Pencil, Trash2 } from "lucide-react";

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
    <Card className="card-hover overflow-hidden transition-all bg-[var(--ink)] text-[var(--surface)] border-[var(--ink-soft)] group h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {note.category && <Badge variant="outline" className="text-xs shrink-0">{note.category}</Badge>}
              {note.file_type && <Badge variant="secondary" className="text-xs shrink-0 uppercase">{note.file_type || "pdf"}</Badge>}
            </div>
            <h3
              className="font-semibold line-clamp-2 text-sm cursor-pointer hover:text-[var(--accent)] transition-colors display-font"
              onClick={() => onDetail(note)}
            >
              {note.title}
            </h3>
            <p className="mt-1 text-xs text-white/70">{note.subject}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <NoteBookmarkButton noteId={note.id} />
            {isOwner && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(note)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete?.(note)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 flex-1">
        {note.description && (
          <p className="text-xs text-white/70 line-clamp-2 mb-3">{note.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.semester && <Badge variant="secondary" className="text-xs">Sem {note.semester}</Badge>}
          {note.branch && <Badge variant="outline" className="text-xs">{note.branch}</Badge>}
          {note.university && <Badge variant="outline" className="text-xs">{note.university}</Badge>}
          {note.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span>{Number(note.rating || 0).toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /><span>{note.views || 0}</span></div>
          <div className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /><span>{note.downloads || 0}</span></div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-[var(--ink-soft)]/30">
        <div className="flex w-full gap-1.5">
          <Button variant="outline" size="sm" className="flex-1 text-xs bg-transparent text-white border-white/20 hover:bg-white/10" onClick={() => onPreview(note)}>
            <Eye className="mr-1 h-3 w-3" />Preview
          </Button>
          <Button variant="default" size="sm" className="flex-1 text-xs bg-[var(--accent)] text-[var(--ink)] hover:bg-[var(--accent)]/90" onClick={() => onDetail(note)}>
            <Star className="mr-1 h-3 w-3" />Rate & Comment
          </Button>
          <Button variant="secondary" size="sm" className="text-xs px-2 bg-white/10 text-white hover:bg-white/20" onClick={() => onAI(note)}>
            <Sparkles className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs px-2 bg-transparent text-white border-white/20 hover:bg-white/10" onClick={() => onSession(note)}>
            <Users className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  </ScrollReveal>
);
