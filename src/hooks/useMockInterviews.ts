import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

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
  pricePerHour: number;
}

export interface BookingSlot {
  id: string;
  starts_at: string;
  is_booked: boolean;
}

export interface MockBooking {
  _id: string;
  mentorId: MentorProfile;
  mentor?: { title: string; company: string };
  mentor_profile?: { _id: string; full_name: string; avatar_url: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  meetingLink?: string;
  menteeNotes?: string;
}

// Hook to fetch mock interview professionals
export const useMockInterviewers = (expertiseFilter?: string) => {
  return useQuery({
    queryKey: ['mockInterviewers', expertiseFilter],
    queryFn: async () => {
      // Mock interviews are represented by specific expertise tags
      const searchTags = expertiseFilter 
        ? [expertiseFilter] 
        : ['Technical Interview', 'HR Interview', 'System Design', 'Behavioral'];
      
      const { data } = await api.get(`/mentors`, {
        params: {
          expertise: searchTags.join(','),
          isFree: true, // Assuming mock interviews are free for now
        }
      });
      return data.mentors as MentorProfile[];
    }
  });
};

// Hook to fetch available slots
export const useMentorAvailability = (mentorId: string) => {
  return useQuery({
    queryKey: ['mentorAvailability', mentorId],
    queryFn: async () => {
      const { data } = await api.get(`/mentors/${mentorId}/availability`);
      return data as BookingSlot[];
    },
    enabled: !!mentorId
  });
};

// Hook to fetch "My Bookings"
export const useMyMockBookings = () => {
  return useQuery({
    queryKey: ['myMockBookings'],
    queryFn: async () => {
      const { data } = await api.get('/mentors/bookings/me');
      return data as MockBooking[];
    }
  });
};

// Booking Mutation
export const useBookMockInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mentorId, scheduledAt, menteeNotes }: { mentorId: string, scheduledAt: string, menteeNotes: string }) => {
      const { data } = await api.post('/mentors/bookings', { mentorId, scheduledAt, menteeNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMockBookings'] });
      queryClient.invalidateQueries({ queryKey: ['mentorAvailability'] });
    }
  });
};

// Cancel Booking
export const useCancelMockBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string, reason: string }) => {
      const { data } = await api.post(`/mentors/bookings/${bookingId}/cancel`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMockBookings'] });
    }
  });
};

// Reschedule Booking
export const useRescheduleMockBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, newDate, reason }: { bookingId: string, newDate: string, reason: string }) => {
      const { data } = await api.post(`/mentors/bookings/${bookingId}/reschedule`, { newDate, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMockBookings'] });
    }
  });
};
