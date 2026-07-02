import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link2, FileText, ExternalLink, Plus } from "lucide-react";

export const ResourcesTab = ({ classroomId, isHost }: { classroomId: string, isHost: boolean }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const [type, setType] = useState("link");

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from("virtual_classroom_resources")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
      if (data) setResources(data);
    };
    
    fetchResources();

    const channel = supabase.channel(`resources-${classroomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_classroom_resources', filter: `classroom_id=eq.${classroomId}` }, () => {
        fetchResources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user) return;
    
    await supabase.from("virtual_classroom_resources").insert({
      classroom_id: classroomId,
      user_id: user.id,
      title,
      url,
      type // Saving type ('link', 'gdrive', 'lms')
    });
    
    setTitle("");
    setUrl("");
    setAdding(false);
  };

  const getIcon = (type: string, url: string) => {
    if (type === 'gdrive' || url.includes('drive.google.com')) return <div className="text-blue-500 font-bold text-xs">GD</div>;
    if (type === 'lms' || url.includes('canvas') || url.includes('blackboard')) return <div className="text-purple-500 font-bold text-xs">LMS</div>;
    return url.includes("http") ? <Link2 className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {resources.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-4">No resources shared yet.</p>
        ) : (
          resources.map(res => (
            <a 
              key={res.id} 
              href={res.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                {getIcon(res.type, res.url)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{res.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {res.type === 'lms' ? 'Open Assignment' : 'Open Link'} <ExternalLink className="h-3 w-3" />
                </p>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Add Form */}
      {adding ? (
        <form onSubmit={handleAdd} className="space-y-3 p-3 border rounded-lg bg-card">
          <Input 
            placeholder="Title (e.g. Syllabus, Assignment 1)" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            className="h-8 text-sm"
          />
          <select 
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={type} 
            onChange={(e) => setType(e.target.value)}
          >
            <option value="link">General Web Link</option>
            <option value="gdrive">Google Drive Folder</option>
            <option value="lms">LMS Integration (Canvas/Moodle)</option>
          </select>
          <Input 
            placeholder="URL" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            required 
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="flex-1 h-8 text-xs">Connect Resource</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="w-full gap-2 shrink-0" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Connect Resource / LMS
        </Button>
      )}
    </div>
  );
};
