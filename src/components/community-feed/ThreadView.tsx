import React, { useEffect, useState } from 'react';
import { useCommunityFeed, FeedPost } from '@/hooks/useCommunityFeed';
import { PostItem } from './PostItem';
import { PostComposer } from './PostComposer';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreadViewProps {
  postId: string;
  onBack: () => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<FeedPost | null>(null);
  const [replies, setReplies] = useState<FeedPost[]>([]);
  const { fetchThread, loading } = useCommunityFeed();

  useEffect(() => {
    loadThread();
  }, [postId]);

  const loadThread = async () => {
    const data = await fetchThread(postId);
    if (data) {
      setPost(data.post);
      setReplies(data.replies);
    }
  };

  const handleReplyCreated = (newReply: FeedPost) => {
    setReplies([...replies, newReply]);
    if (post) {
      setPost({ ...post, comment_count: post.comment_count + 1 });
    }
  };

  if (loading && !post) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Post not found or has been deleted.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Thread</h2>
      </div>

      {/* Parent Post */}
      <div className="border-b pb-4 mb-4">
        <PostItem post={post} />
      </div>

      {/* Reply Composer */}
      <div className="pl-8 mb-6">
        <PostComposer 
          collegeId={post.collegeId} 
          parentPostId={post._id} 
          onPostCreated={handleReplyCreated}
          placeholder="Post your reply..."
        />
      </div>

      {/* Replies */}
      <div className="space-y-3">
        {replies.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">No replies yet. Be the first!</p>
        ) : (
          replies.map(reply => (
            <PostItem key={reply._id} post={reply} />
          ))
        )}
      </div>
    </div>
  );
};
