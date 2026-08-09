import React, { useEffect, useState } from 'react';
import { useCommunityFeed, FeedPost } from '@/hooks/useCommunityFeed';
import { PostComposer } from './PostComposer';
import { PostItem } from './PostItem';
import { ThreadView } from './ThreadView';
import { Loader2 } from 'lucide-react';
import { FollowButton } from './FollowButton';

interface FeedLayoutProps {
  collegeId?: string; // If provided, shows college-scoped feed. If not, shows cross-college general feed.
  title?: string;
  description?: string;
}

export const FeedLayout: React.FC<FeedLayoutProps> = ({ collegeId, title, description }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { fetchGeneralFeed, fetchCollegeFeed, loading } = useCommunityFeed();

  useEffect(() => {
    loadFeed();
  }, [collegeId]);

  const loadFeed = async () => {
    let data = [];
    if (collegeId) {
      data = await fetchCollegeFeed(collegeId);
    } else {
      data = await fetchGeneralFeed();
    }
    setPosts(data);
  };

  const handlePostCreated = (newPost: FeedPost) => {
    setPosts([newPost, ...posts]);
  };

  if (activeThreadId) {
    return <ThreadView postId={activeThreadId} onBack={() => setActiveThreadId(null)} />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full pb-20">
      {/* Feed Header */}
      {(title || description || collegeId) && (
        <div className="flex flex-col gap-2 pb-2 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{title || "Community Feed"}</h1>
            {collegeId && <FollowButton targetId={collegeId} type="college" />}
          </div>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Composer */}
      <PostComposer collegeId={collegeId} onPostCreated={handlePostCreated} />

      {/* Feed List */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No posts yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostItem 
              key={post._id} 
              post={post} 
              onThreadClick={(id) => setActiveThreadId(id)} 
            />
          ))
        )}
      </div>
    </div>
  );
};
