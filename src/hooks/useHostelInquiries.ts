import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hostel } from './useHostels';

export interface Inquiry {
  _id: string;
  hostelId: string | Hostel;
  senderId: string;
  ownerId: string;
  name: string;
  preferredRoomType: string;
  moveInDate: string;
  message: string;
  status: 'sent' | 'responded';
  createdAt: string;
}

const API_URL = 'http://localhost:5000/api/hostels';

export const useSendInquiry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inquiryData: Partial<Inquiry>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/${inquiryData.hostelId}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(inquiryData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to send inquiry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-inquiries'] });
    }
  });
};

export const useMyInquiries = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['hostel-inquiries', 'sent', userId],
    queryFn: async (): Promise<Inquiry[]> => {
      const token = localStorage.getItem('token');
      if (!token) return [];

      const response = await fetch(`${API_URL}/inquiries/sent`, {
        headers: {
          'x-auth-token': token
        }
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
    enabled: !!userId
  });
};

export const useOwnerInbox = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['hostel-inquiries', 'received', userId],
    queryFn: async (): Promise<Inquiry[]> => {
      const token = localStorage.getItem('token');
      if (!token) return [];

      const response = await fetch(`${API_URL}/inquiries/received`, {
        headers: {
          'x-auth-token': token
        }
      });
      if (!response.ok) throw new Error('Failed to fetch inbox');
      return response.json();
    },
    enabled: !!userId
  });
};

export const useRespondInquiry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inquiryId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/inquiries/${inquiryId}/respond`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to respond to inquiry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-inquiries'] });
    }
  });
};
