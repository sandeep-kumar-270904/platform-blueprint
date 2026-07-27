import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface ReplyItem {
  _id?: string;
  userId?: any;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface CommentItem {
  _id?: string;
  userId?: any;
  authorName: string;
  authorAvatar?: string;
  text: string;
  reportedBy?: string[];
  replies?: ReplyItem[];
  createdAt: string;
}

export interface CreatorContentItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
  } | string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  type: 'article' | 'video' | 'project' | 'resource';
  description: string;
  body: string;
  thumbnail: string;
  mediaUrl?: string;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  commentsCount: number;
  likedBy: string[];
  viewedBy?: string[];
  reportedBy?: string[];
  reportCount?: number;
  moderationStatus?: 'normal' | 'under_review' | 'actioned';
  comments?: CommentItem[];
  hasMoreComments?: boolean;
  totalComments?: number;
  commentsPage?: number;
  tags?: string[];
  status?: string;
  relatedModule?: string;
  relatedItemId?: string;
  relatedItemLabel?: string;
  createdAt: string;
}

export interface CreatorProfileData {
  creator: {
    _id: string;
    name: string;
    bio: string;
    avatar: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isMuted?: boolean;
  };
  stats: {
    totalContent: number;
    totalViews: number;
    totalLikes: number;
  };
  content: CreatorContentItem[];
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export const useCreatorFeed = (type?: string, search?: string, sort?: string, tag?: string) => {
  return useInfiniteQuery<PaginatedResponse<CreatorContentItem>>({
    queryKey: ['creator-feed', type, search, sort, tag],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (tag && tag !== 'all') params.append('tag', tag);
      if (search) params.append('search', search);
      if (sort && sort !== 'recent') params.append('sort', sort);
      params.append('page', String(pageParam));
      params.append('limit', '20');
      const res = await api.get(`/creators/content?${params.toString()}`);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
};

export const useMyCreatorContent = (type?: string, search?: string, sort?: string, tag?: string) => {
  return useInfiniteQuery<PaginatedResponse<CreatorContentItem>>({
    queryKey: ['my-creator-content', type, search, sort, tag],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (tag && tag !== 'all') params.append('tag', tag);
      if (search) params.append('search', search);
      if (sort && sort !== 'recent') params.append('sort', sort);
      params.append('page', String(pageParam));
      params.append('limit', '20');
      const res = await api.get(`/creators/content/my?${params.toString()}`);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
};

export const useCreateCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreatorContentItem>) => {
      const res = await api.post('/creators/content', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useUpdateCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatorContentItem> }) => {
      const res = await api.put(`/creators/content/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useDeleteCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/creators/content/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useLikeCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/creators/content/${id}/like`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useCommentCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const res = await api.post(`/creators/content/${id}/comment`, { text });
      return res.data;
    },
    onSuccess: (updatedItem, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useViewCreatorContent = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/creators/content/${id}/view`);
      return res.data;
    }
  });
};

export const useSeedCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/creators/content/seed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useCreatorRecommendations = () => {
  return useQuery<CreatorContentItem[]>({
    queryKey: ['creator-recommendations'],
    queryFn: async () => {
      const res = await api.get('/creators/recommendations');
      return res.data;
    }
  });
};

export const useCreatorProfile = (userId: string | null) => {
  return useQuery<CreatorProfileData>({
    queryKey: ['creator-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      const res = await api.get(`/creators/profile/${userId}`);
      return res.data;
    },
    enabled: !!userId
  });
};

export const useFollowCreator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/creators/profile/${userId}/follow`);
      return res.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile', userId] });
    }
  });
};

export const useCreatorContentDetail = (id: string | null) => {
  return useQuery<CreatorContentItem>({
    queryKey: ['creator-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      const res = await api.get(`/creators/content/${id}`);
      return res.data;
    },
    enabled: !!id
  });
};

export const useReplyCreatorComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, commentId, text }: { id: string; commentId: string; text: string }) => {
      const res = await api.post(`/creators/content/${id}/comment/${commentId}/reply`, { text });
      return res.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['creator-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
    }
  });
};

export const useReportCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, commentId }: { id: string; reason: string; commentId?: string }) => {
      const res = await api.post(`/creators/content/${id}/report`, { reason, commentId });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['creator-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['creator-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-content'] });
    }
  });
};

export const useMuteCreator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/creators/profile/${userId}/mute`);
      return res.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile', userId] });
    }
  });
};

export interface AnalyticsData {
  totals: { views: number; likes: number; comments: number };
  timeseries: { date: string; views: number; likes: number }[];
  topPerforming: { id: string; title: string; views: number; likes: number; type: string }[];
  audienceBreakdown: { name: string; value: number }[];
}

export const useCreatorAnalytics = () => {
  return useQuery<AnalyticsData>({
    queryKey: ['creator-analytics'],
    queryFn: async () => {
      const res = await api.get('/creators/analytics');
      return res.data;
    }
  });
};

export const useCheckContentSimilarity = () => {
  return useMutation({
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      const res = await api.post('/creators/content/check-similarity', { title, body });
      return res.data;
    }
  });
};

export const useCrossPostToCommunity = () => {
  return useMutation({
    mutationFn: async ({ title, url, description }: { title: string; url: string; description: string }) => {
      const content = `Check out this new creator content: **${title}**\n\n${description}\n\n${url}`;
      const res = await api.post('/community/posts', { content, tags: ['CreatorContent'] });
      return res.data;
    }
  });
};



export const useReviewCreatorContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, text }: { contentId: string; text: string }) => {
      const res = await api.post(`/creators/content/${contentId}/review-comments`, { text });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-review-requests'] });
    }
  });
};

export const useCreatorReviewRequests = () => {
  return useQuery({
    queryKey: ['creator-review-requests'],
    queryFn: async () => {
      const res = await api.get('/creators/content');
      // Hacky simulation for demo purposes: we filter content that is in review
      return res.data.filter((item: any) => item.status === 'in_review');
    }
  });
};
