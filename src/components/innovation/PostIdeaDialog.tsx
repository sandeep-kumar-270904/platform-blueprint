import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Rocket, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const categories = ["EdTech", "HealthTech", "FinTech", "Social Impact", "IoT", "AI/ML", "Web3", "Commerce", "DevTools", "Other"];

interface PostIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PostIdeaDialog = ({ open, onOpenChange }: PostIdeaDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 6) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !description.trim() || !category) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/ideas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          tags,
          status: "draft",
          is_public: true,
        })
      });

      if (res.ok) {
        toast.success("Idea posted!");
        setTitle(""); setDescription(""); setCategory(""); setTags([]);
        onOpenChange(false);
      } else {
        toast.error("Failed to post idea");
      }
    } catch {
      toast.error("Failed to post idea");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Post Your Idea
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your idea name" maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your idea, the problem it solves, and your vision..." rows={4} maxLength={2000} />
          </div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags (up to 6)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 6}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Post Idea
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
