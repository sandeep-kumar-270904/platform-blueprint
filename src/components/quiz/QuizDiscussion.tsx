import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Pin, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function QuizDiscussion({ quizId, isCreator }: { quizId: string, isCreator: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const loadComments = async () => {
    try {
      const res = await api.get(`/quiz-comments/quiz/${quizId}`);
      setComments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadComments();
  }, [quizId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/quiz-comments/quiz/${quizId}`, { text: newComment });
      setNewComment('');
      loadComments();
    } catch (e) {
      toast.error('Failed to post comment');
    }
  };

  const handlePin = async (commentId: string) => {
    try {
      await api.put(`/quiz-comments/${commentId}/pin`);
      loadComments();
    } catch (e) {
      toast.error('Failed to pin comment');
    }
  };

  const handleReport = () => {
    toast.success('Comment reported for moderation');
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5"/> Discussion</h3>
      
      <form onSubmit={handlePost} className="flex gap-2 mb-6">
        <Input 
          placeholder="Share your thoughts on this quiz..." 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
        />
        <Button type="submit">Post</Button>
      </form>

      <div className="space-y-4">
        {comments.map(c => (
          <Card key={c._id} className={c.isPinned ? "border-primary bg-primary/5" : ""}>
            <CardContent className="p-4 flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={c.user?.avatar_url} />
                <AvatarFallback>{c.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{c.user?.username}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    {c.isPinned && <span className="flex items-center gap-1 text-xs text-primary font-medium"><Pin className="w-3 h-3"/> Pinned</span>}
                  </div>
                  <div className="flex gap-2">
                    {isCreator && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handlePin(c._id)}>
                        {c.isPinned ? 'Unpin' : 'Pin'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500" onClick={handleReport}>
                      <Flag className="w-3 h-3"/>
                    </Button>
                  </div>
                </div>
                <p className="text-sm mt-2">{c.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first to start the discussion!</p>}
      </div>
    </div>
  );
}
