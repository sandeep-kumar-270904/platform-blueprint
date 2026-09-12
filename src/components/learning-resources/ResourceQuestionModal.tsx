import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, Loader2 } from "lucide-react";
import { createQuestion } from "@/hooks/useQABoard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ResourceQuestionModalProps {
  resource: any;
  trigger?: React.ReactNode;
}

export const ResourceQuestionModal = ({ resource, trigger }: ResourceQuestionModalProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(`Question regarding: ${resource.title}`);
  const [body, setBody] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to ask a question");
      return;
    }
    
    setLoading(true);
    try {
      const fullBody = `${body}\n\n---\n**Context:** Asking about the resource [${resource.title}](/learning-resources/${resource._id})`;
      
      const techTag = resource.technology ? resource.technology.toLowerCase().replace(/\s+/g, '-') : 'technology';
      
      await createQuestion({
        title,
        body: fullBody,
        category: "Technology",
        tags: [techTag, "learning-resource"]
      });
      
      setOpen(false);
      setBody("");
      toast.success("Question posted to Q&A Board successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full sm:w-auto" size="lg">
            <HelpCircle className="w-4 h-4 mr-2" /> Ask Community for Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ask for Help</DialogTitle>
          <DialogDescription>
            Stuck on something in this tutorial? Ask the community and we'll notify Alumni who are experts in {resource.technology}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Question Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="What are you stuck on?"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Include the timestamp (e.g., At 14:32...) and the code giving you trouble."
              rows={5}
              required 
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
