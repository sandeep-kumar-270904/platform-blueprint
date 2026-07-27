import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const GlobalSocketListener = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleBadgeEarned = (data: { badgeId: string; badgeName: string }) => {
      toast.success(`🎉 You earned a new badge: ${data.badgeName}!`, {
        description: 'Check your profile to see all your unlocked badges.',
        duration: 5000,
      });
    };

    const handleContentModerated = (data: { contentId: string; action: string; commentId?: string }) => {
      if (data.action === 'removed') {
        queryClient.setQueriesData({ queryKey: ['creator-feed'] }, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          return oldData.filter((item: any) => item._id !== data.contentId);
        });
        queryClient.setQueriesData({ queryKey: ['my-creator-content'] }, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          return oldData.filter((item: any) => item._id !== data.contentId);
        });
      }
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      queryClient.invalidateQueries({ queryKey: ['creator-content-detail'] });
    };

    socket.on('badgeEarned', handleBadgeEarned);
    socket.on('creators:content_moderated', handleContentModerated);

    return () => {
      socket.off('badgeEarned', handleBadgeEarned);
      socket.off('creators:content_moderated', handleContentModerated);
    };
  }, [socket, queryClient]);

  return null; // This component doesn't render anything
};

