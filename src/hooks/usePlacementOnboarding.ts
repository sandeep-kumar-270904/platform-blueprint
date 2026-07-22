import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export const usePlacementOnboarding = () => {
  return useQuery({
    queryKey: ['placementOnboarding'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/placement-onboarding`, { headers: getAuthHeaders() });
      return res.data;
    }
  });
};
