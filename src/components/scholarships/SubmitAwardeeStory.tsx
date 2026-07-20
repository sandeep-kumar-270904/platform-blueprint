import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Loader2, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SubmitAwardeeStoryProps {
  scholarshipId: string;
  onSubmitted?: () => void;
}

export const SubmitAwardeeStory: React.FC<SubmitAwardeeStoryProps> = ({ scholarshipId, onSubmitted }) => {
  const [content, setContent] = useState('');
  const [impactArea, setImpactArea] = useState('Tuition');
  const [showRealName, setShowRealName] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (!content.trim() && !isDraft) return toast.error("Please share your story");

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/awardee-stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, impactArea, showRealName, status: isDraft ? 'draft' : 'submitted' })
      });

      if (res.ok) {
        if (isDraft) {
          toast.success("Story saved as draft.");
        } else {
          toast.success("Impact story submitted for review! Thank you for inspiring others.");
          setContent('');
          if (onSubmitted) onSubmitted();
        }
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to submit story');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Share Your Impact Story
        </CardTitle>
        <CardDescription>
          You were awarded this scholarship! Share how it has impacted your journey to inspire future applicants.
        </CardDescription>
      </CardHeader>
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Impact Area</label>
            <Select value={impactArea} onValueChange={setImpactArea}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tuition">Tuition & Fees</SelectItem>
                <SelectItem value="Living Expenses">Living Expenses</SelectItem>
                <SelectItem value="Books/Supplies">Books & Supplies</SelectItem>
                <SelectItem value="Research/Project">Research or Projects</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Story</label>
            <Textarea
              placeholder="How has this scholarship changed your academic or personal life? What advice do you have for future applicants?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="anonymous-toggle" 
              checked={!showRealName} 
              onCheckedChange={(c) => setShowRealName(!c)} 
            />
            <Label htmlFor="anonymous-toggle">Post anonymously as 'A StudentHub student'</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Story
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
