import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useAdminSkillSwapStats = () => {
  return useQuery({
    queryKey: ['adminSkillSwapStats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/skill-swap/stats');
      return data;
    }
  });
};

export const useAdminSkillSwapReports = (page = 1, limit = 20, status = '', targetType = '') => {
  return useQuery({
    queryKey: ['adminSkillSwapReports', page, limit, status, targetType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(targetType && { targetType })
      });
      const { data } = await api.get(`/admin/skill-swap/reports?${params}`);
      return data;
    }
  });
};

export const useAdminResolveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolutionNotes, trustFlag, targetUserId }: any) => {
      const { data } = await api.patch(`/admin/skill-swap/reports/${id}`, {
        status, resolutionNotes, trustFlag, targetUserId
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkillSwapReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminSkillSwapStats'] });
    }
  });
};

export const useAdminSkillSwapOffers = (page = 1, limit = 20, status = '', search = '') => {
  return useQuery({
    queryKey: ['adminSkillSwapOffers', page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search })
      });
      const { data } = await api.get(`/admin/skill-swap/offers?${params}`);
      return data;
    }
  });
};

export const useAdminModerateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, reason }: { id: string, action: 'deactivate' | 'reinstate', reason: string }) => {
      const { data } = await api.patch(`/admin/skill-swap/offers/${id}/moderate`, { action, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkillSwapOffers'] });
    }
  });
};

export const useAdminSkillSwapUser = (userId: string) => {
  return useQuery({
    queryKey: ['adminSkillSwapUser', userId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/skill-swap/users/${userId}`);
      return data;
    },
    enabled: !!userId
  });
};
