import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DSAProblem {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  companies: string[];
  link: string;
}

export interface DSAProblemsResponse {
  problems: DSAProblem[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const useDSAProblems = (page: number, search: string, difficulty: string, topic: string, company: string) => {
  return useQuery<DSAProblemsResponse>({
    queryKey: ['dsa-problems', page, search, difficulty, topic, company],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        difficulty,
        topic,
        company
      });
      const res = await axios.get(`${API_URL}/api/dsa/problems?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });
};

export const useDSAProgress = () => {
  return useQuery({
    queryKey: ['dsa-progress'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/dsa/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as { solved_problems: string[], totalProblems: number };
    }
  });
};

export const useDSAMetadata = () => {
  return useQuery({
    queryKey: ['dsa-metadata'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/dsa/metadata`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as { topics: string[], companies: string[] };
    }
  });
};

export const useToggleSolve = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, solved }: { id: string; solved: boolean }) => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_URL}/api/dsa/problems/${id}/solve`, { solved }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as string[];
    },
    onMutate: async ({ id, solved }) => {
      await queryClient.cancelQueries({ queryKey: ['dsa-progress'] });
      const previousProgress = queryClient.getQueryData(['dsa-progress']);
      
      queryClient.setQueryData(['dsa-progress'], (old: any) => {
        if (!old) return old;
        const newSolved = solved 
          ? [...old.solved_problems, id]
          : old.solved_problems.filter((pid: string) => pid !== id);
        return { ...old, solved_problems: newSolved };
      });
      
      return { previousProgress };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['dsa-progress'], context.previousProgress);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-progress'] });
    }
  });
};

export const useResetDSAProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/api/dsa/progress/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-progress'] });
    }
  });
};
