import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Youtube, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SubmitResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SubmitResourceModal = ({ open, onOpenChange, onSuccess }: SubmitResourceModalProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    url: "",
    technology: "",
    topic: "",
    subtopic: "",
    difficulty: "Beginner",
    purpose: "Learn from scratch",
    language: "English",
    tags: "",
    recommendationReason: ""
  });

  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [availableSubtopics, setAvailableSubtopics] = useState<string[]>([]);
  
  const [isCustomTech, setIsCustomTech] = useState(false);
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [isCustomSubtopic, setIsCustomSubtopic] = useState(false);

  React.useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/taxonomy`);
        const data = await res.json();
        if (data.success) setTaxonomies(data.flat);
      } catch (err) {
        console.error("Failed to load taxonomy", err);
      }
    };
    if (open) fetchTaxonomy();
  }, [open]);

  // Update cascade when technology changes
  React.useEffect(() => {
    const tech = taxonomies.find(t => t.name === formData.technology);
    if (tech) {
      setAvailableTopics(tech.topics || []);
      setFormData(prev => ({ ...prev, topic: "", subtopic: "" }));
    } else {
      setAvailableTopics([]);
    }
  }, [formData.technology, taxonomies]);

  // Update cascade when topic changes
  React.useEffect(() => {
    const topic = availableTopics.find(t => t.name === formData.topic);
    if (topic) {
      setAvailableSubtopics(topic.subtopics || []);
      setFormData(prev => ({ ...prev, subtopic: "" }));
    } else {
      setAvailableSubtopics([]);
    }
  }, [formData.topic, availableTopics]);

  const purposes = [
    "Learn from scratch", "Beginner Setup", "Interview Preparation", 
    "Placement Preparation", "Project Development", "Deep dive", 
    "Quick Concept", "Troubleshooting", "Certification"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.includes("youtube.com") && !formData.url.includes("youtu.be")) {
      toast.error("Please provide a valid YouTube URL");
      return;
    }
    
    if (!formData.technology || !formData.topic) {
      toast.error("Please select a Technology and Topic");
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/learning-resources`, {
        method: 'POST',
        headers,
        credentials: 'include',
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
        technology: "",
        topic: "",
        subtopic: "",
        difficulty: "Beginner",
        purpose: "Learn from scratch",
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
              <Label>Technology</Label>
              {isCustomTech ? (
                <div className="flex gap-2">
                  <Input 
                    value={formData.technology} 
                    onChange={(e) => setFormData({...formData, technology: e.target.value})} 
                    placeholder="Type custom tech..." 
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => { setIsCustomTech(false); setFormData({...formData, technology: ""}); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select 
                  value={formData.technology || undefined} 
                  onValueChange={(v) => {
                    if (v === 'OTHER_CUSTOM_TECH') {
                      setIsCustomTech(true);
                      setIsCustomTopic(true);
                      setIsCustomSubtopic(true);
                      setFormData({...formData, technology: "", topic: "", subtopic: ""});
                    } else {
                      setFormData({...formData, technology: v});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tech" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomies.map(t => <SelectItem key={t._id || t.name} value={t.name}>{t.name}</SelectItem>)}
                    <SelectItem value="OTHER_CUSTOM_TECH" className="font-semibold text-primary">+ Add Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              {isCustomTopic ? (
                <div className="flex gap-2">
                  <Input 
                    value={formData.topic} 
                    onChange={(e) => setFormData({...formData, topic: e.target.value})} 
                    placeholder="Type custom topic..." 
                  />
                  {!isCustomTech && (
                    <Button type="button" variant="outline" size="icon" onClick={() => { setIsCustomTopic(false); setFormData({...formData, topic: ""}); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Select 
                  disabled={!formData.technology} 
                  value={formData.topic || undefined} 
                  onValueChange={(v) => {
                    if (v === 'OTHER_CUSTOM_TOPIC') {
                      setIsCustomTopic(true);
                      setIsCustomSubtopic(true);
                      setFormData({...formData, topic: "", subtopic: ""});
                    } else {
                      setFormData({...formData, topic: v});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                    {formData.technology && (
                      <SelectItem value="OTHER_CUSTOM_TOPIC" className="font-semibold text-primary">+ Add Custom</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subtopic (Optional)</Label>
              {isCustomSubtopic ? (
                <div className="flex gap-2">
                  <Input 
                    value={formData.subtopic} 
                    onChange={(e) => setFormData({...formData, subtopic: e.target.value})} 
                    placeholder="Type custom subtopic..." 
                  />
                  {!isCustomTopic && (
                    <Button type="button" variant="outline" size="icon" onClick={() => { setIsCustomSubtopic(false); setFormData({...formData, subtopic: ""}); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Select 
                  disabled={!formData.topic || availableSubtopics.length === 0} 
                  value={formData.subtopic || undefined} 
                  onValueChange={(v) => {
                    if (v === 'OTHER_CUSTOM_SUBTOPIC') {
                      setIsCustomSubtopic(true);
                      setFormData({...formData, subtopic: ""});
                    } else {
                      setFormData({...formData, subtopic: v});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availableSubtopics.length === 0 ? "N/A" : "Select Subtopic"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubtopics.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    {formData.topic && (
                      <SelectItem value="OTHER_CUSTOM_SUBTOPIC" className="font-semibold text-primary">+ Add Custom</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Learning Intent / Purpose</Label>
              <Select value={formData.purpose || undefined} onValueChange={(v) => setFormData({...formData, purpose: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={formData.difficulty || undefined} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
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
              <Select value={formData.language || undefined} onValueChange={(v) => setFormData({...formData, language: v})}>
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
