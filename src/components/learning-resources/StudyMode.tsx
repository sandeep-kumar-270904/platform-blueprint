import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Maximize, Minimize } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface StudyModeProps {
  resource: any;
  onExit: () => void;
}

export const StudyMode = ({ resource, onExit }: StudyModeProps) => {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/learning-resources/${resource._id}/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setNote(data.data.markdown_content || "");
        }
      } catch (err) {
        console.error("Failed to fetch notes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [resource._id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/learning-resources/${resource._id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markdown_content: note })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Notes saved securely to your profile");
      } else {
        toast.error("Failed to save notes");
      }
    } catch (err) {
      toast.error("An error occurred while saving notes");
    } finally {
      setSaving(false);
    }
  };

  const getEmbedUrl = () => {
    if (resource.type === 'video') return `https://www.youtube.com/embed/${resource.youtubeId}?rel=0`;
    if (resource.type === 'playlist') return `https://www.youtube.com/embed/videoseries?list=${resource.youtubeId}&rel=0`;
    return null;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'min-h-[80vh] border rounded-xl overflow-hidden'}`}>
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onExit} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit Deep Work
          </Button>
          <h2 className="font-semibold text-lg line-clamp-1 hidden md:block">{resource.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Notes
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Video Player */}
        <div className="w-full lg:w-2/3 bg-black flex flex-col relative aspect-video lg:aspect-auto">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white p-8 text-center">
              Cannot embed this resource type directly. Please use standard view.
            </div>
          )}
        </div>

        {/* Smart Notes Editor */}
        <div className="w-full lg:w-1/3 flex flex-col bg-muted/20 border-l">
          <div className="p-3 border-b bg-muted/40 font-medium text-sm flex justify-between items-center">
            <span>My Smart Notes</span>
            <span className="text-xs text-muted-foreground">Markdown supported</span>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Take notes while you watch... These will auto-sync to your NotesHub profile."
              className="flex-1 resize-none border-0 focus-visible:ring-0 rounded-none p-4 bg-transparent font-mono text-sm leading-relaxed min-h-[300px] lg:min-h-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};
