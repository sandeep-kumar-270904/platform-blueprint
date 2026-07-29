import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hostel } from './useHostels';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSavedHostelIds = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['saved-hostels', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const response = await fetch(`${API_URL}/hostels/saved`, {
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch saved hostels');
      }
      const data: Hostel[] = await response.json();
      return data.map(hostel => hostel._id);
    },
    enabled: !!userId,
  });
};

export const useToggleSaveHostel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, hostelId, isCurrentlySaved }: { userId: string; hostelId: string; isCurrentlySaved: boolean }) => {
      const method = isCurrentlySaved ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/hostels/${hostelId}/save`, {
        method,
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle saved hostel');
      }
      
      return response.json(); // returns updated array of object ids
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-hostels', variables.userId] });
    }
  });
};
