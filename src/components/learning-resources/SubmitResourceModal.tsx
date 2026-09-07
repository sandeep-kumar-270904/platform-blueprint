import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SubmitResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SubmitResourceModal = ({ open, onOpenChange, onSuccess }: SubmitResourceModalProps) => {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    url: "",
    subject: "",
    topic: "",
    difficulty: "Beginner",
    language: "English",
    tags: "",
    recommendationReason: ""
  });

  const subjects = [
    "Computer Science",
    "Data Structures & Algorithms",
    "Web Development",
    "System Design",
    "Mathematics",
    "Physics",
    "Engineering",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.includes("youtube.com") && !formData.url.includes("youtu.be")) {
      toast.error("Please provide a valid YouTube URL");
      return;
    }
    
    if (!formData.subject || !formData.topic) {
      toast.error("Please fill in the subject and topic");
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      const res = await fetch(`${API_URL}/api/learning-resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit resource");
      }

      toast.success("Learning resource submitted successfully!");
      setFormData({
        url: "",
        subject: "",
        topic: "",
        difficulty: "Beginner",
        language: "English",
        tags: "",
        recommendationReason: ""
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Add YouTube Resource
          </DialogTitle>
          <DialogDescription>
            Submit a useful YouTube video, channel, or playlist for the community. We will automatically fetch the video details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input 
              placeholder="https://youtube.com/watch?v=..." 
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData({...formData, subject: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input 
                placeholder="e.g. Java HashMaps" 
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (Comma separated)</Label>
            <Input 
              placeholder="DSA, Arrays, Placement" 
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Why do you recommend this?</Label>
            <Textarea 
              placeholder="Explain why this is useful for other students..." 
              value={formData.recommendationReason}
              onChange={(e) => setFormData({...formData, recommendationReason: e.target.value})}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Submit Resource
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
