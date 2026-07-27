import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface SkillOffer {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  skillName: string;
  category: string;
  description: string;
  proficiencyLevel: string;
  wantsToLearn: string[];
  availability: string;
  status: string;
  createdAt: string;
}

export interface SkillMatch {
  myOffer: SkillOffer;
  otherOffer: SkillOffer;
  matchScore: number;
}

export interface SkillRequest {
  _id: string;
  fromUser: { _id: string; name: string; avatar: string };
  toUser: { _id: string; name: string; avatar: string };
  offer: { _id: string; skillName: string; category: string };
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'no-show';
  createdAt: string;
  scheduledAt?: string;
}

export interface SkillSession {
  _id: string;
  request: SkillRequest | string;
  participants: { _id: string; name: string; avatar: string }[];
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface SkillReview {
  _id: string;
  session: string;
  reviewer: { _id: string; name: string; avatar: string };
  reviewee: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Fetch all active offers with pagination and filters
export const useSkillOffers = (page = 1, limit = 10, search = '', category = '', proficiencyLevel = '') => {
  return useQuery({
    queryKey: ['skillOffers', page, limit, search, category, proficiencyLevel],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(proficiencyLevel && { proficiencyLevel })
      });
      const { data } = await api.get(`/skill-swap/offers?${params}`);
      return data;
    }
  });
};

// Fetch current user's offers
export const useMySkillOffers = () => {
  return useQuery({
    queryKey: ['mySkillOffers'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/offers/mine');
      return data.data as SkillOffer[];
    }
  });
};

// Fetch matches
export const useSkillMatches = () => {
  return useQuery({
    queryKey: ['skillMatches'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/matches');
      return data.data as SkillMatch[];
    }
  });
};

// Fetch requests
export const useSkillRequests = () => {
  return useQuery({
    queryKey: ['skillRequests'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/requests');
      return data.data as { incoming: SkillRequest[], outgoing: SkillRequest[] };
    }
  });
};

// Fetch my sessions
export const useMySessions = () => {
  return useQuery({
    queryKey: ['skillSessions'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/sessions/mine');
      return data.data as SkillSession[];
    }
  });
};

// Fetch user reviews
export const useUserReviews = (userId: string) => {
  return useQuery({
    queryKey: ['skillReviews', userId],
    queryFn: async () => {
      const { data } = await api.get(`/skill-swap/users/${userId}/reviews`);
      return data.data as { reviews: SkillReview[], stats: { averageRating: number, reviewCount: number } };
    },
    enabled: !!userId
  });
};

// Mutations
export const useCreateSkillOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (offerData: Partial<SkillOffer>) => {
      const { data } = await api.post('/skill-swap/offers', offerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySkillOffers'] });
      queryClient.invalidateQueries({ queryKey: ['skillOffers'] });
      queryClient.invalidateQueries({ queryKey: ['skillMatches'] });
    }
  });
};

export const useUpdateSkillOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<SkillOffer> }) => {
      const { data } = await api.patch(`/skill-swap/offers/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySkillOffers'] });
      queryClient.invalidateQueries({ queryKey: ['skillOffers'] });
    }
  });
};

export const useDeleteSkillOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/skill-swap/offers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySkillOffers'] });
      queryClient.invalidateQueries({ queryKey: ['skillOffers'] });
      queryClient.invalidateQueries({ queryKey: ['skillMatches'] });
    }
  });
};

export const useCreateSkillRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ toUserId, offerId, message }: { toUserId: string, offerId: string, message: string }) => {
      const { data } = await api.post('/skill-swap/requests', { toUserId, offerId, message });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
    }
  });
};

export const useUpdateSkillRequestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data } = await api.patch(`/skill-swap/requests/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
      queryClient.invalidateQueries({ queryKey: ['skillSessions'] });
    }
  });
};

export const useScheduleRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string, scheduledAt: string }) => {
      const { data } = await api.patch(`/skill-swap/requests/${id}/schedule`, { scheduledAt });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
      queryClient.invalidateQueries({ queryKey: ['skillSessions'] });
    }
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/skill-swap/requests/${id}/complete`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
      queryClient.invalidateQueries({ queryKey: ['skillSessions'] });
    }
  });
};

export const useCancelRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/skill-swap/requests/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
      queryClient.invalidateQueries({ queryKey: ['skillSessions'] });
    }
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, rating, comment }: { sessionId: string, rating: number, comment?: string }) => {
      const { data } = await api.post(`/skill-swap/sessions/${sessionId}/review`, { rating, comment });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillReviews'] });
      queryClient.invalidateQueries({ queryKey: ['skillOffers'] });
    }
  });
};
