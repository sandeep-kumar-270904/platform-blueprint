import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = 'http://localhost:5000/api/hostels';

export interface HostelReview {
  _id: string;
  hostelId: string;
  userId: {
    _id: string;
    full_name: string;
    avatar_url: string;
    university: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export const useHostelReviews = (hostelId: string) => {
  return useQuery({
    queryKey: ['hostelReviews', hostelId],
    queryFn: async (): Promise<HostelReview[]> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${hostelId}/reviews`, {
        headers: {
          'x-auth-token': token || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!hostelId
  });
};

export const useCreateHostelReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ hostelId, rating, comment }: { hostelId: string; rating: number; comment: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to leave a review');

      const response = await fetch(`${API_URL}/${hostelId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ rating, comment })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.msg || 'Failed to submit review');
      }
      return response.json();
    },
    onSuccess: (_, { hostelId }) => {
      queryClient.invalidateQueries({ queryKey: ['hostelReviews', hostelId] });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    }
  });
};

export const useUpdateHostelReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ rating, comment })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.msg || 'Failed to update review');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all reviews and hostels to refresh aggregates
      queryClient.invalidateQueries({ queryKey: ['hostelReviews'] });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    }
  });
};

export const useDeleteHostelReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) throw new Error('Failed to delete review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelReviews'] });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    }
  });
};

export const useReportHostelReview = () => {
  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.msg || 'Failed to report review');
      }
      return response.json();
    }
  });
};

export const useOwnerReputation = (ownerId: string) => {
  return useQuery({
    queryKey: ['ownerReputation', ownerId],
    queryFn: async (): Promise<{ rating: number; reviewCount: number }> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/owner/${ownerId}/reputation`, {
        headers: {
          'x-auth-token': token || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reputation');
      return response.json();
    },
    enabled: !!ownerId
  });
};
