import { useEffect } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  useEffect(() => {
    const syncAttempts = async () => {
      const queuedStr = localStorage.getItem('queuedAttempts');
      if (!queuedStr) return;
      
      const queued = JSON.parse(queuedStr);
      if (queued.length === 0) return;

      toast.info(`Syncing ${queued.length} offline quiz attempt(s)...`);
      
      const remaining = [];
      for (const attempt of queued) {
        try {
          await api.post(`/attempts/${attempt.id}/submit-attempt`, {
            answers: attempt.answers,
            autoSubmit: attempt.autoSubmit,
            clientCompletedAt: attempt.clientCompletedAt
          });
          toast.success('Offline attempt synced successfully!');
        } catch (err) {
          console.error('Failed to sync attempt', err);
          remaining.push(attempt);
        }
      }
      
      localStorage.setItem('queuedAttempts', JSON.stringify(remaining));
    };

    const handleOnline = () => {
      syncAttempts();
    };

    window.addEventListener('online', handleOnline);
    // Also try on mount in case they came online while app was closed
    if (navigator.onLine) {
      syncAttempts();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
};
