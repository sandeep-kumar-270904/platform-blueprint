import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AdminAwardeeStories() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/awardee-stories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error("Error fetching awardee stories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleModerate = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/awardee-stories/${id}/moderate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        toast.success(`Story ${action === 'approve' ? 'approved' : 'rejected'}`);
        fetchStories();
      } else {
        toast.error("Action failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">No Pending Stories</h3>
        <p className="text-muted-foreground">All awardee stories have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stories.map(story => (
        <Card key={story._id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{story.storyText?.substring(0, 50)}...</CardTitle>
                <CardDescription>
                  Submitted on {format(new Date(story.createdAt), 'PP')}
                </CardDescription>
              </div>
              <Badge variant="secondary">Pending Review</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md mb-4 text-sm whitespace-pre-wrap">
              {story.storyText}
            </div>
            {story.mediaUrls && story.mediaUrls.length > 0 && (
              <div className="flex gap-2 mb-4">
                {story.mediaUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="Awardee" className="h-20 w-20 object-cover rounded" />
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleModerate(story._id, 'reject')} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => handleModerate(story._id, 'approve')} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
