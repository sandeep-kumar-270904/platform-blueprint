import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RoommateProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string; // Hidden in discovery
    profilePicture?: string;
  };
  cleanliness: 'Messy' | 'Average' | 'Clean' | 'Neat Freak';
  sleepSchedule: 'Early Bird' | 'Night Owl' | 'Flexible';
  noiseTolerance: 'Low' | 'Medium' | 'High';
  smoking: 'No' | 'Yes' | 'Outside only';
  pets: 'No' | 'Yes' | 'Cats only' | 'Dogs only';
  budgetRange: { min: number; max: number };
  moveInDate: string;
  bio?: string;
  compatibilityScore?: number; // Added dynamically by the backend discovery algorithm
}

export interface RoommateConnection {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
  };
  recipient: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
  };
  status: 'Pending' | 'Accepted' | 'Declined';
  createdAt: string;
}

export const useRoommates = () => {
  const queryClient = useQueryClient();

  // 1. Profile Queries
  const myProfile = useQuery({
    queryKey: ['myRoommateProfile'],
    queryFn: async () => {
      try {
        const res = await api.get('/roommates/profile');
        return res.data as RoommateProfile;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false
  });

  const upsertProfile = useMutation({
    mutationFn: async (data: Partial<RoommateProfile>) => {
      const res = await api.post('/roommates/profile', data);
      return res.data as RoommateProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRoommateProfile'] });
      queryClient.invalidateQueries({ queryKey: ['discoverRoommates'] });
    }
  });

  // 2. Discover Queries
  const discoverRoommates = useQuery({
    queryKey: ['discoverRoommates'],
    queryFn: async () => {
      try {
        const res = await api.get('/roommates/discover');
        return res.data as RoommateProfile[];
      } catch (err: any) {
        if (err.response?.status === 400) return null; // "Please create your own profile first"
        throw err;
      }
    },
    enabled: !!myProfile.data // Only discover if we have a profile
  });

  // 3. Connection Queries
  const getConnections = useQuery({
    queryKey: ['roommateConnections'],
    queryFn: async () => {
      const res = await api.get('/roommates/connections');
      return res.data as RoommateConnection[];
    }
  });

  const sendConnection = useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await api.post('/roommates/connections', { recipientId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateConnections'] });
    }
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'Accepted' | 'Declined' }) => {
      const res = await api.put(`/roommates/connections/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommateConnections'] });
    }
  });

  return {
    myProfile,
    upsertProfile,
    discoverRoommates,
    getConnections,
    sendConnection,
    updateConnection
  };
};
