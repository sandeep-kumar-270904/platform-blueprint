import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface TechQuestion {
  _id: string;
  question: string;
  approach: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
}

export interface HrTip {
  _id: string;
  question: string;
  guidance: string;
  category: string;
}

export interface CompanyPrep {
  _id: string;
  name: string;
  logoUrl?: string;
  companyType: 'Product-based' | 'Service-based' | 'Startup';
  experienceCount?: number;
  guideCount?: number;
  overview: {
    hiringStages: string[];
    eligibilityCriteria: string;
    typicalRoles: string[];
  };
  technicalQuestions: TechQuestion[];
  hrTips: HrTip[];
}

export interface InterviewExperience {
  _id: string;
  companyId: string;
  author: {
    _id: string;
    full_name: string;
    username: string;
    avatarUrl?: string;
  };
  title: string;
  outcome: 'Offered' | 'Rejected' | 'Waitlisted';
  rounds: { roundName: string; details: string }[];
  status: string;
  createdAt: string;
}

export const useInterviewCompanies = (search: string, type: string) => {
  return useQuery({
    queryKey: ['interview-companies', search, type],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ search, type });
      const res = await axios.get(`${API_URL}/api/interview-prep/companies?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as CompanyPrep[];
    }
  });
};

export const useCompanyDetail = (id: string) => {
  return useQuery({
    queryKey: ['company-prep', id],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/interview-prep/companies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as CompanyPrep;
    },
    enabled: !!id
  });
};

export const useCompanyExperiences = (id: string) => {
  return useQuery({
    queryKey: ['company-experiences', id],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/interview-prep/companies/${id}/experiences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as InterviewExperience[];
    },
    enabled: !!id
  });
};

export const useInterviewProgress = (companyId: string) => {
  return useQuery({
    queryKey: ['interview-progress', companyId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/interview-prep/progress/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as { reviewed_tech: string[]; reviewed_hr: string[] };
    },
    enabled: !!companyId
  });
};

export const useToggleInterviewProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, type, questionId, reviewed }: { companyId: string; type: 'tech'|'hr'; questionId: string; reviewed: boolean }) => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_URL}/api/interview-prep/progress/${companyId}/toggle`, 
        { type, questionId, reviewed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onMutate: async ({ companyId, type, questionId, reviewed }) => {
      await queryClient.cancelQueries({ queryKey: ['interview-progress', companyId] });
      const previousProgress = queryClient.getQueryData(['interview-progress', companyId]);
      
      queryClient.setQueryData(['interview-progress', companyId], (old: any) => {
        if (!old) return old;
        const arrName = type === 'tech' ? 'reviewed_tech' : 'reviewed_hr';
        const newArr = reviewed 
          ? [...old[arrName], questionId]
          : old[arrName].filter((id: string) => id !== questionId);
        return { ...old, [arrName]: newArr };
      });
      
      return { previousProgress, companyId };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['interview-progress', context.companyId], context.previousProgress);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interview-progress', variables.companyId] });
    }
  });
};

export const useSubmitExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string, data: any }) => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_URL}/api/interview-prep/companies/${companyId}/experiences`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-experiences', variables.companyId] });
    }
  });
};
