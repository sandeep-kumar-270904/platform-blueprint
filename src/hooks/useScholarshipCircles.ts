import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface UserSnippet {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface SharedScholarship {
  scholarshipId: {
    _id: string;
    title: string;
    provider: string;
    applicationDeadline: string;
    amount: { min?: number, max?: number };
    amountType: string;
  };
  addedBy: string;
  addedAt: string;
}

export interface ScholarshipCircle {
  _id: string;
  name: string;
  inviteCode: string;
  createdBy: UserSnippet;
  memberIds: UserSnippet[];
  sharedGoal?: string;
  sharedScholarships: SharedScholarship[];
  createdAt: string;
}

export interface CircleAggregate {
  totalApplicationsStarted: number;
  totalApplicationsSubmitted: number;
  totalAwarded: number;
  membersWithAtLeastOneSubmission: number;
  membersWithAtLeastOneStarted: number;
}

export interface CircleDetailsResponse {
  circle: ScholarshipCircle;
  aggregate: CircleAggregate;
}

export const useScholarshipCircles = () => {
  const queryClient = useQueryClient();

  const getCircles = useQuery({
    queryKey: ['scholarship-circles'],
    queryFn: async () => {
      const res = await api.get<ScholarshipCircle[]>('/scholarships/circles');
      return res.data;
    }
  });

  const getCircleDetails = (circleId?: string) => useQuery({
    queryKey: ['scholarship-circle', circleId],
    queryFn: async () => {
      if (!circleId) return null;
      const res = await api.get<CircleDetailsResponse>(`/scholarships/circles/${circleId}`);
      return res.data;
    },
    enabled: !!circleId
  });

  const createCircle = useMutation({
    mutationFn: async (data: { name: string, sharedGoal?: string }) => {
      const res = await api.post<ScholarshipCircle>('/scholarships/circles', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarship-circles'] });
    }
  });

  const joinCircle = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await api.post<ScholarshipCircle>('/scholarships/circles/join', { inviteCode });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarship-circles'] });
    }
  });

  const shareScholarship = useMutation({
    mutationFn: async ({ circleId, scholarshipId }: { circleId: string, scholarshipId: string }) => {
      const res = await api.post<ScholarshipCircle>(`/scholarships/circles/${circleId}/share`, { scholarshipId });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scholarship-circle', variables.circleId] });
    }
  });

  const leaveCircle = useMutation({
    mutationFn: async (circleId: string) => {
      const res = await api.delete(`/scholarships/circles/${circleId}/leave`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarship-circles'] });
    }
  });

  return {
    getCircles,
    getCircleDetails,
    createCircle,
    joinCircle,
    shareScholarship,
    leaveCircle
  };
};
