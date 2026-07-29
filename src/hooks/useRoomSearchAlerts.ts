import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface SearchAlertCriteria {
  location?: string;
  maxRent?: number;
  roomType?: 'All' | 'Single' | 'Shared' | 'Entire Unit';
  minBeds?: number;
}

export interface RoomSearchAlert {
  _id: string;
  user: string;
  title: string;
  criteria: SearchAlertCriteria;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useRoomSearchAlerts = () => {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['roomSearchAlerts'],
    queryFn: async () => {
      const { data } = await api.get<RoomSearchAlert[]>('/search-alerts');
      return data;
    }
  });

  const createAlert = useMutation({
    mutationFn: async (newAlert: { title: string; criteria?: SearchAlertCriteria; isActive?: boolean }) => {
      const { data } = await api.post<RoomSearchAlert>('/search-alerts', newAlert);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomSearchAlerts'] });
    }
  });

  const updateAlert = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ title: string; criteria: SearchAlertCriteria; isActive: boolean }> }) => {
      const response = await api.put<RoomSearchAlert>(`/search-alerts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomSearchAlerts'] });
    }
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/search-alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomSearchAlerts'] });
    }
  });

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    isError: alertsQuery.isError,
    createAlert,
    updateAlert,
    deleteAlert
  };
};
