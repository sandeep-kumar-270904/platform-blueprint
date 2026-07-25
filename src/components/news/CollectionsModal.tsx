import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Bookmark, Folder, Users, Share2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCollections, createCollection, saveToCollection, toggleBookmark } from "@/hooks/useNews";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function CollectionsModal({ 
  open, 
  onOpenChange, 
  articleId, 
  isSaved, 
  onSimpleBookmark 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  articleId: string,
  isSaved: boolean,
  onSimpleBookmark: () => void 
}) {
  const { collections, fetchCollections } = useCollections();
  const [newColName, setNewColName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Collaborator state
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [addingCollab, setAddingCollab] = useState(false);

  useEffect(() => {
    if (open) fetchCollections();
  }, [open]);

  const handleCreate = async () => {
    if (!newColName.trim()) return;
    setCreating(true);
    try {
      await createCollection(newColName);
      setNewColName('');
      await fetchCollections();
      toast.success("Collection created");
    } catch (err: any) {
      toast.error("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveToCollection = async (collectionId: string) => {
    setSaving(true);
    try {
      await saveToCollection(articleId, collectionId);
      toast.success("Saved to collection");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save to collection");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollaborator = async (collectionId: string) => {
    if (!collabEmail.trim()) return;
    setAddingCollab(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/news/collections/${collectionId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: collabEmail })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error adding collaborator');
      }
      toast.success("Collaborator added!");
      setCollabEmail('');
      await fetchCollections();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingCollab(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start h-12" 
            onClick={() => {
              onSimpleBookmark();
              onOpenChange(false);
            }}
          >
            <Bookmark className={`mr-2 h-5 w-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            {isSaved ? 'Remove from general Bookmarks' : 'Quick Save to Bookmarks'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or select a collection</span></div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {collections.map(col => (
              <div key={col._id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-2 hover:bg-muted/50">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleSaveToCollection(col._id)}
                  >
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{col.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        {col.collaborators?.length || 0} collaborators
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveColId(activeColId === col._id ? null : col._id)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {activeColId === col._id && (
                  <div className="bg-muted p-3 border-t border-border">
                    <p className="text-xs font-semibold mb-2">Invite Collaborator</p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="user@example.com" 
                        value={collabEmail} 
                        onChange={e => setCollabEmail(e.target.value)} 
                        className="h-8 text-sm"
                      />
                      <Button size="sm" className="h-8" onClick={() => handleAddCollaborator(col._id)} disabled={addingCollab}>
                        {addingCollab ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Invite'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {collections.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No collections yet.</p>}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Input 
              placeholder="New Collection Name" 
              value={newColName} 
              onChange={e => setNewColName(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={creating || !newColName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
