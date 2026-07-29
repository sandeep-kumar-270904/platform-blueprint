import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RoomRentalReview {
  _id: string;
  room: string;
  owner: string;
  reviewer: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface RoomRentalStats {
  avgRating: number;
  count: number;
}

export const useRoomRentalReviews = (roomId?: string, ownerId?: string) => {
  const queryClient = useQueryClient();

  const getRoomReviews = useQuery({
    queryKey: ['roomReviews', roomId],
    queryFn: async () => {
      const res = await api.get(`/room-rental-reviews/room/${roomId}`);
      return res.data as { reviews: RoomRentalReview[], stats: RoomRentalStats };
    },
    enabled: !!roomId
  });

  const getOwnerReputation = useQuery({
    queryKey: ['ownerReputation', ownerId],
    queryFn: async () => {
      const res = await api.get(`/room-rental-reviews/owner/${ownerId}`);
      return res.data as RoomRentalStats;
    },
    enabled: !!ownerId
  });

  const leaveReview = useMutation({
    mutationFn: async ({ roomId, rating, reviewText }: { roomId: string, rating: number, reviewText: string }) => {
      const { data } = await api.post(`/room-rental-reviews/room/${roomId}`, { rating, reviewText });
      return data as RoomRentalReview;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roomReviews', variables.roomId] });
    }
  });

  const editReview = useMutation({
    mutationFn: async ({ reviewId, rating, reviewText }: { reviewId: string, rating: number, reviewText: string }) => {
      const { data } = await api.put(`/room-rental-reviews/${reviewId}`, { rating, reviewText });
      return data as RoomRentalReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roomReviews', data.room] });
    }
  });

  const deleteReview = useMutation({
    mutationFn: async ({ reviewId, roomId }: { reviewId: string, roomId: string }) => {
      const { data } = await api.delete(`/room-rental-reviews/${reviewId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roomReviews', variables.roomId] });
    }
  });

  const reportReview = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string, reason: string }) => {
      const { data } = await api.post(`/room-rental-reviews/${reviewId}/report`, { reason });
      return data;
    }
  });

  return {
    getRoomReviews,
    getOwnerReputation,
    leaveReview,
    editReview,
    deleteReview,
    reportReview
  };
};
