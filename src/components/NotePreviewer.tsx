import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ExternalLink, Loader2, FileText, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotePreviewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: any;
  onView?: (noteId: string) => void;
  onDownload?: (noteId: string) => void;
  onAddComment?: (noteId: string, content: string) => Promise<any>;
}

export const NotePreviewer = ({ open, onOpenChange, note, onView, onDownload, onAddComment }: NotePreviewerProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Reset states when note changes
  useEffect(() => {
    if (open && note) {
      setLoading(true);
      setError(false);
      if (onView) onView(note.id);
      fetchComments();
    }
  }, [open, note]);

  const fetchComments = async () => {
    if (!note) return;
    setLoadingComments(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/notes/${note.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onAddComment || !note) return;
    
    setSubmitting(true);
    try {
      const added = await onAddComment(note.id, newComment);
      setComments([added, ...comments]);
      setNewComment("");
      toast.success("Comment added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!note) return null;

  // Resolve the raw file URL correctly to avoid hitting frontend routes
  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    
    // If it's a relative path, prefix it with the API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  const fileUrl = getFullUrl(note.content_url);
  const isPdf = fileUrl.toLowerCase().includes('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl.toLowerCase());
  const hasInlinePreview = isPdf || isImage;

  const handleDownload = async () => {
    if (onDownload) onDownload(note.id);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("File not found");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract extension from URL, fallback to .pdf
      const ext = fileUrl.split('.').pop()?.split(/[#?]/)[0] || 'pdf';
      a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: just open the file directly if blob download fails (e.g. CORS)
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-4">
        <DialogHeader className="px-2 mb-2">
          <DialogTitle className="text-xl">{note.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{note.subject}</p>
        </DialogHeader>

        <div className="flex gap-2 mb-4 px-2">
          <Button onClick={handleDownload} variant="secondary" size="sm" className="h-8">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={() => window.open(fileUrl, "_blank")}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 px-2 pb-2">
          {/* Document Viewer */}
          <div className="flex-1 border rounded-lg overflow-hidden relative bg-muted flex items-center justify-center min-h-[300px]">
            {loading && hasInlinePreview && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {error ? (
               <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full w-full bg-card">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">This file couldn't be loaded</h3>
                <p className="text-sm max-w-md mb-6">The file reference might be broken, or the file was deleted from storage.</p>
                <Button onClick={handleDownload} variant="secondary">Try Downloading Instead</Button>
              </div>
            ) : isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                className="w-full h-full border-0 bg-background"
                title={note.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            ) : isImage ? (
              <img 
                src={fileUrl} 
                alt={note.title} 
                className="max-w-full max-h-full object-contain p-4"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full w-full bg-card">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Preview not available</h3>
                <p className="text-sm max-w-md mb-6">This file type cannot be previewed inline. Please download it to view the contents.</p>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download File
                </Button>
              </div>
            )}
          </div>

          {/* Comments Sidebar */}
          <div className="w-full lg:w-80 flex flex-col border rounded-lg bg-card overflow-hidden shrink-0">
            <div className="p-3 border-b bg-muted/30 font-semibold text-sm flex items-center justify-between">
              Comments {comments.length > 0 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{comments.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-[200px]">
              {loadingComments ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : comments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_id?.avatar_url} />
                      <AvatarFallback>{(comment.user_id?.full_name || comment.user_id?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm">{comment.user_id?.full_name || comment.user_id?.username || 'Unknown User'}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t bg-muted/10">
              {user ? (
                <form onSubmit={submitComment} className="flex gap-2">
                  <Input 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..." 
                    className="h-9 text-sm"
                    disabled={submitting}
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={submitting || !newComment.trim()}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <div className="text-sm text-center text-muted-foreground p-2 bg-muted/50 rounded-md">
                  Please sign in to comment
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
