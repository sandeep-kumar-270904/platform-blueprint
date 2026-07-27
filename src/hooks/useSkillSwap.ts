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

// Fetch recommendations
export const useSkillSwapRecommendations = () => {
  return useQuery({
    queryKey: ['skillRecommendations'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/recommendations');
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

export interface SkillSwapBadge {
  _id: string;
  user: string;
  badgeType: 'first-swap' | 'five-swaps' | 'top-rated' | 'reliable-teacher';
  earnedAt: string;
}

// Fetch user badges
export const useUserBadges = (userId: string) => {
  return useQuery({
    queryKey: ['skillBadges', userId],
    queryFn: async () => {
      const { data } = await api.get(`/skill-swap/users/${userId}/badges`);
      return data.data as SkillSwapBadge[];
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

export const useCreateSkillSwapReport = () => {
  return useMutation({
    mutationFn: async (reportData: { targetType: string, targetId: string, reason: string, description: string }) => {
      const { data } = await api.post('/skill-swap/reports', reportData);
      return data;
    }
  });
};

export const useMarkNoShow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/skill-swap/requests/${id}/no-show`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
      queryClient.invalidateQueries({ queryKey: ['skillSessions'] });
    }
  });
};

// Circle Interfaces
export interface SkillCircle {
  _id: string;
  creator: { _id: string; name: string; avatar?: string };
  skillName: string;
  category: string;
  description: string;
  maxMembers: number;
  members: { _id: string; name: string; avatar?: string }[] | string[];
  recurrence: 'one-time' | 'weekly' | 'biweekly';
  scheduleInfo: { dayOfWeek?: string; time?: string; date?: string };
  status: 'open' | 'full' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SkillCircleMessage {
  _id: string;
  circle: string;
  sender: { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
}

// Circle Queries
export const useCircles = (page = 1, limit = 20, search = '', category = '') => {
  return useQuery({
    queryKey: ['skillCircles', page, limit, search, category],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category })
      });
      const { data } = await api.get(`/skill-swap/circles?${params}`);
      return data;
    }
  });
};

export const useMyCircles = () => {
  return useQuery({
    queryKey: ['mySkillCircles'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/circles/mine');
      return data.circles as SkillCircle[];
    }
  });
};

export const useCircleDetail = (id: string) => {
  return useQuery({
    queryKey: ['skillCircle', id],
    queryFn: async () => {
      const { data } = await api.get(`/skill-swap/circles/${id}`);
      return data;
    },
    enabled: !!id
  });
};

// Circle Mutations
export const useCreateCircle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (circleData: Partial<SkillCircle>) => {
      const { data } = await api.post('/skill-swap/circles', circleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['mySkillCircles'] });
    }
  });
};

export const useJoinCircle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/skill-swap/circles/${id}/join`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['skillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['mySkillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['skillCircle', id] });
    }
  });
};

export const useLeaveCircle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/skill-swap/circles/${id}/leave`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['skillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['mySkillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['skillCircle', id] });
    }
  });
};

export const useCancelCircle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/skill-swap/circles/${id}`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['skillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['mySkillCircles'] });
      queryClient.invalidateQueries({ queryKey: ['skillCircle', id] });
    }
  });
};

// PHASE 9 Interfaces
export interface SkillGoal {
  _id: string;
  user: string;
  goalType: 'sessions-per-month' | 'skills-to-learn' | 'skills-to-teach';
  target: number;
  period: 'month' | 'year';
  status: 'active' | 'completed' | 'expired';
  progress: number;
}

// PHASE 9 Queries
export const useRecommendedCircles = () => {
  return useQuery({
    queryKey: ['recommendedCircles'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/circles/recommended');
      return data.data as SkillCircle[];
    }
  });
};

export const useUserEndorsements = (userId: string) => {
  return useQuery({
    queryKey: ['skillEndorsements', userId],
    queryFn: async () => {
      const { data } = await api.get(`/skill-swap/users/${userId}/endorsements`);
      return data.data as Record<string, { total: number, verified: number, endorsers: any[] }>;
    },
    enabled: !!userId
  });
};

export const useMyGoals = () => {
  return useQuery({
    queryKey: ['mySkillGoals'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/goals/mine');
      return data.data as SkillGoal[];
    }
  });
};

export const useMyStreak = () => {
  return useQuery({
    queryKey: ['mySkillStreak'],
    queryFn: async () => {
      const { data } = await api.get('/skill-swap/users/me/streak');
      return data.data as { currentStreak: number, longestStreak: number };
    }
  });
};

// PHASE 9 Mutations
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalData: { goalType: string, target: number, period: string }) => {
      const { data } = await api.post('/skill-swap/goals', goalData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySkillGoals'] });
    }
  });
};

export const useCreateEndorsement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (endorsementData: { endorseeId: string, skillName: string, basedOn: string, sessionId?: string }) => {
      const { data } = await api.post('/skill-swap/endorsements', endorsementData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['skillEndorsements', variables.endorseeId] });
    }
  });
};
