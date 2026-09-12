import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowRight, PlayCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  _id: string;
  title: string;
  thumbnailUrl: string;
  technology: string;
  type: string;
}

interface MicroRoadmapsProps {
  currentResourceId: string;
  prerequisites: Resource[];
  nextSteps: Resource[];
  onLinked: () => void;
}

export const MicroRoadmaps = ({ currentResourceId, prerequisites = [], nextSteps = [], onLinked }: MicroRoadmapsProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkType, setLinkType] = useState("prerequisite");
  const [linkedId, setLinkedId] = useState("");

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedId.trim()) return;

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/learning-resources/${currentResourceId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkType, linkedResourceId: linkedId.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link resource");
      
      toast.success("Resource linked successfully!");
      setOpen(false);
      setLinkedId("");
      onLinked();
    } catch (err: any) {
      toast.error(err.message || "Failed to link resource");
    } finally {
      setLoading(false);
    }
  };

  const renderResourceCard = (r: Resource) => (
    <Link key={r._id} to={`/learning-resources/${r._id}`} className="min-w-[250px] w-[250px] group flex-shrink-0">
      <Card className="h-full overflow-hidden hover:border-primary/50 transition-colors">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {r.thumbnailUrl ? (
            <img src={r.thumbnailUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <Badge variant="secondary" className="text-[10px] mb-2">{r.technology}</Badge>
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h4>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8 mt-12 pt-8 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Community Micro-Roadmap</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Suggest Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link a Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLink} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select value={linkType} onValueChange={setLinkType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prerequisite">Required Before (Prerequisite)</SelectItem>
                    <SelectItem value="next_step">Watch Next (Up Next)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resource ID to Link</Label>
                <Input 
                  value={linkedId} 
                  onChange={e => setLinkedId(e.target.value)} 
                  placeholder="Paste the Learning Resource ID here"
                  required
                />
                <p className="text-xs text-muted-foreground">You can find the ID in the URL of the resource.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Link Resource
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold flex items-center text-muted-foreground">
          <ArrowRight className="w-4 h-4 mr-2" /> Prerequisites (Watch these first)
        </h4>
        {prerequisites.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
            {prerequisites.map(renderResourceCard)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No prerequisites linked yet.</p>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold flex items-center text-muted-foreground">
          <ArrowRight className="w-4 h-4 mr-2" /> Up Next (Continue your journey)
        </h4>
        {nextSteps.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
            {nextSteps.map(renderResourceCard)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No next steps linked yet.</p>
        )}
      </div>
    </div>
  );
};
