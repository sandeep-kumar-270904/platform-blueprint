import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useNavigate } from 'react-router-dom';
import { RichComposer } from '../community/RichComposer';

interface PostComposerProps {
  collegeId?: string;
  parentPostId?: string;
  onPostCreated: (post: any) => void;
  placeholder?: string;
}

export const PostComposer: React.FC<PostComposerProps> = ({ 
  collegeId, 
  parentPostId, 
  onPostCreated, 
}) => {
  const { user } = useAuth();
  const { createPost } = useCommunityFeed();
  const navigate = useNavigate();

  const handleRichSubmit = async (
    content: string, 
    tags: string[], 
    files: File[], 
    poll?: any, 
    options?: { category?: string, isAnonymous?: boolean }
  ) => {
    if (!user) {
      navigate('/auth');
      return false;
    }

    const newPost = await createPost(
      content, 
      collegeId, 
      parentPostId, 
      [], // image_urls placeholder (uploading files not fully implemented yet)
      options?.category,
      poll?.options,
      options?.isAnonymous
    );

    if (newPost) {
      onPostCreated(newPost);
      return true;
    }
    return false;
  };

  return (
    <RichComposer onSubmit={handleRichSubmit} user={user} />
  );
};
