import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/progress';

export interface ProgressData {
  overallReadiness: number;
  dsaStats: { totalSolved: number; easy: number; medium: number; hard: number; };
  interviewPrepStats: { companiesTargeted: number; targetReadiness: number; itemsReviewed: number; };
  mockStats: { completed: number; upcoming: number; averageRating: number; };
  streaks: { currentStreak: number; longestStreak: number; history: string[]; };
  targetCompanies: any[]; // Populated company_ids array
}

export const useProgressDashboard = () => {
  return useQuery<ProgressData>({
    queryKey: ['progress-dashboard'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/dashboard`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return data;
    }
  });
};

export const useTargetCompanies = () => {
  return useQuery({
    queryKey: ['target-companies'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/target-companies`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return data;
    }
  });
};

export const useUpdateTargetCompanies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (company_ids: string[]) => {
      const { data } = await axios.post(`${API_URL}/target-companies`, { company_ids }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-companies'] });
      queryClient.invalidateQueries({ queryKey: ['progress-dashboard'] });
    }
  });
};
