import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Check } from 'lucide-react';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  targetId: string;
  type: 'user' | 'college';
  initialIsFollowing?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ targetId, type, initialIsFollowing = false }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const { toggleFollowUser, toggleFollowCollege } = useCommunityFeed();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    let result = null;
    if (type === 'user') {
      result = await toggleFollowUser(targetId);
    } else {
      result = await toggleFollowCollege(targetId);
    }
    
    if (result !== null) {
      setIsFollowing(result);
    }
    setLoading(false);
  };

  return (
    <Button 
      variant={isFollowing ? "secondary" : "default"} 
      size="sm" 
      onClick={handleFollow}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};
