import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, FileText, AlertCircle } from "lucide-react";

interface NotePreviewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: {
    id: string;
    title: string;
    content_url: string;
    subject: string;
  } | null;
}

export const NotePreviewer = ({ open, onOpenChange, note }: NotePreviewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset states when note changes
  useEffect(() => {
    if (open && note) {
      setLoading(true);
      setError(false);
    }
  }, [open, note]);

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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{note.subject}</p>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={() => window.open(fileUrl, "_blank")}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden relative bg-muted flex items-center justify-center">
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
              className="max-w-full max-h-full object-contain"
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
      </DialogContent>
    </Dialog>
  );
};
