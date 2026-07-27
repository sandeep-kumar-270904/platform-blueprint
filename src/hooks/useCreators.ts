import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

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
  status: 'draft' | 'published';
  views: number;
  likes: number;
  commentsCount: number;
  likedBy: string[];
  tags: string[];
  createdAt: string;
}

export const useCreatorFeed = (type?: string, search?: string) => {
  return useQuery<CreatorContentItem[]>({
    queryKey: ['creator-feed', type, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (search) params.append('search', search);
      const res = await api.get(`/creators/content?${params.toString()}`);
      return res.data;
    }
  });
};

export const useMyCreatorContent = (type?: string) => {
  return useQuery<CreatorContentItem[]>({
    queryKey: ['my-creator-content', type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      const res = await api.get(`/creators/content/my?${params.toString()}`);
      return res.data;
    }
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
