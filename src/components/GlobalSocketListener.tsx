import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';

export const GlobalSocketListener = () => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleBadgeEarned = (data: { badgeId: string; badgeName: string }) => {
      toast.success(`🎉 You earned a new badge: ${data.badgeName}!`, {
        description: 'Check your profile to see all your unlocked badges.',
        duration: 5000,
      });
    };

    socket.on('badgeEarned', handleBadgeEarned);

    return () => {
      socket.off('badgeEarned', handleBadgeEarned);
    };
  }, [socket]);

  return null; // This component doesn't render anything
};
