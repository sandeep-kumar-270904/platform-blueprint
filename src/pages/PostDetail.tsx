import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { PostCard } from "./Community";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { togglePostLike, toggleSavePost, votePoll, deletePost, getSimilarPosts } from "@/hooks/useCommunity";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similarPosts, setSimilarPosts] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`http://localhost:5000/api/community/posts/${id}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch post');
      }
      const data = await res.json();
      setPost(data);
      
      setLoadingSimilar(true);
      getSimilarPosts(id!).then(similar => {
        setSimilarPosts(similar);
        setLoadingSimilar(false);
      }).catch(() => setLoadingSimilar(false));
    } catch (err) {
      console.error(err);
      toast.error('Could not load post');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const handleLike = async (type: string) => {
    if (!user) return toast.error("Please login to react");
    try {
      setPost((prev: any) => ({
        ...prev,
        hasLiked: !prev.hasLiked,
        like_count: prev.hasLiked ? Math.max(0, prev.like_count - 1) : prev.like_count + 1
      }));
      await togglePostLike(id!, type);
    } catch (err) {
      setPost((prev: any) => ({
        ...prev,
        hasLiked: !prev.hasLiked,
        like_count: prev.hasLiked ? prev.like_count + 1 : Math.max(0, prev.like_count - 1)
      }));
      toast.error("Failed to react");
    }
  };

  const handleSave = async () => {
    if (!user) return toast.error("Please login to save");
    try {
      setPost((prev: any) => ({ ...prev, saved: !prev.saved }));
      await toggleSavePost(id!);
    } catch (err) {
      setPost((prev: any) => ({ ...prev, saved: !prev.saved }));
      toast.error("Failed to save post");
    }
  };

  const handleVote = async (idx: number) => {
    if (!user) return toast.error("Please login to vote");
    try {
      await votePoll(id!, idx);
      await fetchPost(); // Re-fetch to get updated poll state
    } catch (err) {
      toast.error("Failed to vote");
    }
  };
  
  const handleDelete = async () => {
    if (!user) return;
    try {
      await deletePost(id!);
      toast.success("Post deleted");
      navigate('/community');
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : post ? (
          <>
            <PostCard 
              post={post}
              currentUserId={user?.id}
              onLike={handleLike}
              onSave={handleSave}
              onVote={handleVote}
              onDelete={handleDelete}
              onCommentOptimistic={fetchPost}
              isModerator={user?.role === 'admin'}
            />
            
            {similarPosts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  Similar Posts
                </h3>
                <div className="space-y-4">
                  {similarPosts.map((simPost: any) => (
                    <PostCard 
                      key={simPost.id || simPost._id}
                      post={simPost}
                      currentUserId={user?.id}
                      onLike={async (type) => await togglePostLike(simPost.id || simPost._id, type)}
                      onSave={async () => await toggleSavePost(simPost.id || simPost._id)}
                      onDelete={() => {}}
                      onCommentOptimistic={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {loadingSimilar && !similarPosts.length && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
