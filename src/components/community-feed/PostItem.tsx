import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedPost, useCommunityFeed } from '@/hooks/useCommunityFeed';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Shield, BarChart2, ShieldCheck } from 'lucide-react';

interface PostItemProps {
  post: FeedPost;
  onThreadClick?: (postId: string) => void;
}

export const PostItem: React.FC<PostItemProps> = ({ post, onThreadClick }) => {
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isLiked, setIsLiked] = useState(false); // Should ideally come from backend if user liked it
  const { likePost, votePoll } = useCommunityFeed();
  const { user } = useAuth();

  const [localPollOptions, setLocalPollOptions] = useState(post.pollOptions || []);
  const [localPollVoters, setLocalPollVoters] = useState(post.pollVoters || []);

  const handleVote = async (optionIndex: number) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    const res = await votePoll(post._id, optionIndex);
    if (res) {
      setLocalPollOptions(res.pollOptions);
      setLocalPollVoters(res.pollVoters);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
    
    const newCount = await likePost(post._id);
    if (newCount !== null) {
      setLikeCount(newCount);
    } else {
      // Revert if failed
      setLikeCount(prev => !isLiked ? prev - 1 : prev + 1);
      setIsLiked(!isLiked);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/community/post/${post._id}`);
    toast.success("Link copied to clipboard");
  };

  return (
    <div 
      className="bg-white border rounded-lg p-4 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onThreadClick && onThreadClick(post._id)}
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.user_id.profile_picture || post.user_id.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.user_id.full_name}`} />
          <AvatarFallback>{post.user_id.full_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{post.user_id.full_name}</span>
                {post.isAnonymous && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 gap-1 text-muted-foreground bg-muted/50">
                    <Shield className="h-3 w-3" /> Anonymous
                  </Badge>
                )}
                {post.isOfficial && (
                  <Badge className="text-[10px] h-4 px-1.5 gap-1 bg-blue-600 hover:bg-blue-700 text-white border-transparent">
                    <ShieldCheck className="h-3 w-3" /> Official
                  </Badge>
                )}
                {post.category && post.category !== 'discussion' && post.category !== 'poll' && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">
                    {post.category.replace('_', ' ')}
                  </Badge>
                )}
                <span className="text-muted-foreground text-sm">@{post.user_id.username || 'user'}</span>
                <span className="text-muted-foreground text-xs">• {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
              {(post.user_id.headline || post.user_id.current_role) && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {post.user_id.headline || post.user_id.current_role}
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Post reported for review"); }}>
                  <Flag className="h-4 w-4 mr-2" /> Report Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="mt-2 text-sm whitespace-pre-wrap break-words">
            {post.content}
          </div>

          {post.category === 'poll' && localPollOptions && localPollOptions.length > 0 && (
            <div className="mt-4 space-y-2 border rounded-lg p-3 bg-secondary/5">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary">
                <BarChart2 className="w-4 h-4" /> Poll
              </div>
              <div className="space-y-2 relative z-10">
                {localPollOptions.map((opt, idx) => {
                  const hasVoted = localPollVoters?.some(v => v.userId === (user as any)?.id) || false;
                  const totalVotes = localPollOptions.reduce((acc, o) => acc + o.voteCount, 0);
                  const percent = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                  const isMyVote = localPollVoters?.some(v => v.userId === (user as any)?.id && v.optionIndex === idx);
                  
                  return (
                    <div key={idx} className="relative overflow-hidden rounded-md border bg-background">
                      {hasVoted && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-primary/10 -z-0 transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      )}
                      <Button 
                        variant="ghost" 
                        className={`w-full justify-between h-auto py-2.5 px-3 text-left hover:bg-transparent rounded-none ${hasVoted ? 'cursor-default' : ''} ${isMyVote ? 'border-l-4 border-l-primary' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasVoted) handleVote(idx);
                        }}
                        disabled={hasVoted}
                      >
                        <span className="z-10 font-medium relative text-sm text-foreground">{opt.text}</span>
                        {hasVoted && <span className="z-10 relative text-xs font-semibold text-muted-foreground">{percent}% ({opt.voteCount})</span>}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-right">
                {localPollOptions.reduce((acc, o) => acc + o.voteCount, 0)} total votes
              </div>
            </div>
          )}
          
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden border">
              <img src={post.image_urls[0]} alt="Post attachment" className="w-full max-h-80 object-cover" />
            </div>
          )}

          <div className="flex items-center gap-6 mt-4 text-muted-foreground">
            <button 
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                if (onThreadClick) onThreadClick(post._id);
              }}
            >
              <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{post.comment_count || 0}</span>
            </button>
            
            <button 
              className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
              onClick={handleLike}
            >
              <div className="p-1.5 rounded-full group-hover:bg-pink-50 transition-colors">
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-xs font-medium">{likeCount}</span>
            </button>

            <button 
              className="flex items-center gap-1.5 hover:text-green-500 transition-colors group ml-auto"
              onClick={handleShare}
            >
              <div className="p-1.5 rounded-full group-hover:bg-green-50 transition-colors">
                <Share2 className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
