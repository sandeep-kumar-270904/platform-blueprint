import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export interface MentorProfile {
  _id: string;
  user_id: string;
  profile?: {
    _id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  title: string;
  company: string;
  bio: string;
  expertise: string[];
  yearsOfExperience: number;
  rating: number;
  reviewsCount: number;
  totalSessions: number;
  hourlyRate: number;
  languages: string[];
  isActive: boolean;
}

export interface BookingSlot {
  _id: string;
  mentorId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export interface MockBooking {
  _id: string;
  mentor: MentorProfile;
  mentee: any;
  scheduledAt: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  menteeNotes?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
}

export const useMentors = (filters?: any) => {
  return useQuery({
    queryKey: ['mentors', filters],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/interviews/mentors`, { 
        headers: getAuthHeaders(),
        params: filters 
      });
      return data as MentorProfile[];
    }
  });
};

export const useMentorAvailability = (mentorId?: string) => {
  return useQuery({
    queryKey: ['mentorAvailability', mentorId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/interviews/mentors/${mentorId}/slots`, { headers: getAuthHeaders() });
      return data as BookingSlot[];
    },
    enabled: !!mentorId
  });
};

export const useMyMockBookings = () => {
  return useQuery({
    queryKey: ['myMockBookings'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/interviews/sessions/my`, { headers: getAuthHeaders() });
      return data as MockBooking[];
    }
  });
};

export const useBookMockInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mentorId, scheduledAt, menteeNotes }: { mentorId: string, scheduledAt: string, menteeNotes: string }) => {
      const { data } = await axios.post(`${API_URL}/api/interviews/book`, { mentorId, scheduledAt, menteeNotes }, { headers: getAuthHeaders() });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMockBookings'] });
      queryClient.invalidateQueries({ queryKey: ['mentorAvailability'] });
    }
  });
};

export const useCancelMockBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string, reason: string }) => {
      const { data } = await axios.post(`${API_URL}/api/interviews/sessions/${bookingId}/cancel`, { reason }, { headers: getAuthHeaders() });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMockBookings'] });
    }
  });
};
