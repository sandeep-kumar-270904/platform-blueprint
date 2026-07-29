import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RoomType {
  _id?: string;
  type: 'single' | 'shared' | 'dorm';
  price: number;
  capacity: number;
}

export interface Hostel {
  _id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  type: 'Boys' | 'Girls' | 'Co-ed';
  pricing: number;
  roomTypes: RoomType[];
  amenities: string[];
  totalCapacity: number;
  availableBeds: number;
  isFull?: boolean;
  rating: number;
  reviewCount: number;
  mealPlan: {
    included: boolean;
    type: 'veg' | 'non-veg' | 'both' | null;
    note?: string;
  };
  houseRules: {
    curfewTime?: string;
    guestPolicy?: string;
    otherRules?: string;
  };
  deposit: {
    amount: number;
    refundPolicy?: string;
    lockInPeriod?: string;
  };
  coverPhotoIndex: number;
  photos: string[];
  verificationStatus?: 'none' | 'pending' | 'verified';
  createdAt: string;
}

const API_URL = 'http://localhost:5000/api/hostels';

export const useHostels = (filters?: any) => {
  return useQuery({
    queryKey: ['hostels', filters],
    queryFn: async (): Promise<Hostel[]> => {
      let url = API_URL;
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.amenities?.length) params.append('amenities', filters.amenities.join(','));
        if (filters.roomTypes?.length) params.append('roomTypes', filters.roomTypes.join(','));
        if (filters.includeFull) params.append('includeFull', 'true');
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch hostels');
      }
      return response.json();
    }
  });
};

export const useHostel = (id: string | undefined) => {
  return useQuery({
    queryKey: ['hostels', id],
    queryFn: async (): Promise<Hostel & { ownerContact?: { phone: string, email: string } }> => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['x-auth-token'] = token;

      const response = await fetch(`${API_URL}/${id}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch hostel details');
      }
      return response.json();
    },
    enabled: !!id
  });
};

export const useCreateHostel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to create hostel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    }
  });
};

export const useRequestVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (hostelId: string) => {
      const response = await fetch(`${API_URL}/hostels/${hostelId}/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to request verification');
      }
      return response.json();
    },
    onSuccess: (_, hostelId) => {
      queryClient.setQueryData(['hostels', hostelId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          verificationStatus: 'pending'
        };
      });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    }
  });
};

export const useOwnerHostels = () => {
  return useQuery({
    queryKey: ['ownerHostels'],
    queryFn: async (): Promise<Hostel[]> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      
      const response = await fetch(`${API_URL}/owner/listings`, {
        headers: { 'x-auth-token': token }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch your hostels');
      }
      return response.json();
    }
  });
};

export const useUpdateHostel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'x-auth-token': token },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update hostel');
      }
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['hostels', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerHostels'] });
    }
  });
};

export const useToggleAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isFull }: { id: string, isFull: boolean }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/${id}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ isFull })
      });
      if (!response.ok) {
        throw new Error('Failed to toggle availability');
      }
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['hostels', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerHostels'] });
    }
  });
};

export const useDeleteHostel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      if (!response.ok) {
        throw new Error('Failed to delete hostel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['ownerHostels'] });
    }
  });
};

export const useReportHostel = () => {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to report hostel');
      }
      return data;
    }
  });
};
