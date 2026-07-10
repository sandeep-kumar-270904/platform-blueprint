import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, ExternalLink, Eye, Clock, Flag } from "lucide-react";
import { NoteRating } from "./NoteRating";
import { NoteComments } from "./NoteComments";
import { ReportDialog } from "./ReportDialog";
import { toast } from "sonner";


interface NoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: any;
  onRefresh?: () => void;
}

export const NoteDetailDialog = ({ open, onOpenChange, note, onRefresh }: NoteDetailDialogProps) => {
  const [showReport, setShowReport] = useState(false);

  // Track view when dialog opens
  useEffect(() => {
    if (open && note?.id) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      fetch(`${API_URL}/api/notes/${note.id}/view`, { method: 'POST' })
        .then(() => onRefresh?.())
        .catch(() => {});
    }
  }, [open, note?.id]);

  if (!note) return null;

  const handleDownload = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      fetch(`${API_URL}/api/notes/${note.id}/download`, { method: 'POST' })
        .then(() => onRefresh?.())
        .catch(() => {});

      const response = await fetch(note.content_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started!");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{note.title}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">{note.subject}</Badge>
            {note.category && <Badge variant="secondary">{note.category}</Badge>}
            {note.branch && <Badge variant="outline">{note.branch}</Badge>}
            {note.semester && <Badge variant="outline">Sem {note.semester}</Badge>}
            {note.university && <Badge variant="outline">{note.university}</Badge>}
          </div>
        </DialogHeader>

        {note.description && (
          <p className="text-sm text-muted-foreground">{note.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {note.views || 0} views
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {note.downloads || 0} downloads
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {note.created_at ? new Date(note.created_at).toLocaleDateString() : "Recently"}
          </div>
        </div>

        {/* Rating */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm font-medium mb-2">Rate this note</p>
          <NoteRating noteId={note.id} currentRating={note.rating || 0} onRated={onRefresh} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />Download PDF
          </Button>
          <Button variant="outline" onClick={() => window.open(note.content_url, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />Open
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowReport(true)} title="Report this note">
            <Flag className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <ReportDialog open={showReport} onOpenChange={setShowReport} contentType="note" contentId={note.id} />

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Comments */}
        <NoteComments noteId={note.id} noteOwnerId={note.user_id} />
      </DialogContent>
    </Dialog>
  );
};
