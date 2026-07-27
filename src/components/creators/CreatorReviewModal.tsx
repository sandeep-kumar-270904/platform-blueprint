import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { CreatorContentItem, useReviewCreatorContent } from '../../hooks/useCreators';
import { FileText, Send, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { Badge } from '../ui/badge';

interface CreatorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CreatorContentItem | null;
}

export const CreatorReviewModal: React.FC<CreatorReviewModalProps> = ({ isOpen, onClose, item }) => {
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();
  const reviewMutation = useReviewCreatorContent();

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    reviewMutation.mutate({ contentId: item._id, text: commentText }, {
      onSuccess: () => {
        toast({ title: 'Feedback submitted successfully' });
        setCommentText('');
        onClose();
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to submit feedback. Ensure you are an assigned reviewer.', variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Review Draft Content</DialogTitle>
              <DialogDescription>
                You have been requested to review this draft before it is published.
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-600 border-purple-500/30">In Review</Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
          <div className="flex-1 border rounded-md p-4 overflow-y-auto">
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">By {item.userId.name || 'Creator'}</p>
            
            {item.mediaUrl && (
              <div className="mb-4 rounded-md overflow-hidden bg-muted">
                {item.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                  <img src={item.mediaUrl} alt="Content media" className="w-full h-auto max-h-[300px] object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-muted-foreground">
                    <FileText className="h-8 w-8 mr-2" /> Attached Media Document
                  </div>
                )}
              </div>
            )}
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">{item.body || item.description}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea 
                placeholder="Leave constructive feedback for the creator..." 
                className="resize-none h-[80px]"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit" disabled={!commentText.trim() || reviewMutation.isPending} className="h-[80px] px-6">
                {reviewMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send</>}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
