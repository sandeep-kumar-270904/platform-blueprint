import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminStoriesQueue = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/scholarships/stories/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('You must provide a rejection reason');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/scholarships/stories/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(action === 'reject' ? { reason: rejectionReason } : {})
      });
      
      if (res.ok) {
        toast.success(`Story ${action}d successfully`);
        setStories(prev => prev.filter(s => s._id !== id));
        setActiveStoryId(null);
        setRejectionReason('');
      } else {
        toast.error(`Failed to ${action} story`);
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 ml-64">
        <Header />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Awardee Stories Review Queue</h1>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {stories.length} Pending
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : stories.length === 0 ? (
            <div className="text-center py-24 border rounded-xl bg-muted/20">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Queue is empty</h3>
              <p className="text-muted-foreground">All awardee stories have been reviewed.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {stories.map(story => (
                <Card key={story._id}>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Story for: {story.scholarshipTitle || 'Scholarship Award'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Author: {story.showRealName ? story.authorName || 'Student' : 'Anonymous'} • 
                          Impact Area: {story.impactArea}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap">{story.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 bg-muted/20 border-t py-3">
                    <Dialog open={activeStoryId === story._id} onOpenChange={(open) => {
                      if (!open) {
                        setActiveStoryId(null);
                        setRejectionReason('');
                      } else {
                        setActiveStoryId(story._id);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Story</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this story. This will be sent to the student.</p>
                          <Textarea 
                            placeholder="e.g. Please remove inappropriate language..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setActiveStoryId(null)}>Cancel</Button>
                          <Button variant="destructive" onClick={() => handleAction(story._id, 'reject')}>
                            Confirm Rejection
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(story._id, 'approve')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStoriesQueue;
