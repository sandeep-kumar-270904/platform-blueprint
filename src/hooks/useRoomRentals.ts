import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RoomRental {
  _id: string;
  title: string;
  description: string;
  rent: number;
  roomType: 'Single' | 'Shared' | 'Entire Unit';
  location: string;
  availableBeds: number;
  moveInDate: string;
  photos: string[];
  lister: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
    roommateProfileId?: string;
  };
  verificationStatus: 'None' | 'Pending' | 'Verified' | 'Rejected';
  status: 'Available' | 'Rented';
  reports: { user: string; reason: string; createdAt: string }[];
  createdAt: string;
  utilitiesIncluded?: boolean;
  utilitiesNote?: string;
  amenities?: string[];
  deposit?: number;
  minLease?: number;
  houseRules?: {
    smokingAllowed?: boolean;
    petsAllowed?: boolean;
    guestPolicy?: string;
    genderPreference?: string;
    quietHours?: string;
  };
  reviewStats?: {
    avgRating: number;
    count: number;
  };
}

export interface RoomInquiry {
  _id: string;
  room: Partial<RoomRental>;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  receiver: {
    _id: string;
    name: string;
    email: string;
  };
  message: string;
  moveInDate?: string;
  status: 'Pending' | 'Responded';
  replyMessage?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface RoomRentalQuery {
  search?: string;
  minRent?: string;
  maxRent?: string;
  roomType?: string;
  minBeds?: string;
  maxDate?: string;
  includeRented?: boolean;
  includeExpired?: boolean;
  lat?: string;
  lng?: string;
  radius?: string;
}

export const useRoomRentals = (filters?: RoomRentalQuery) => {
  const queryClient = useQueryClient();

  const getRentals = useQuery({
    queryKey: ['roomRentals', filters],
    queryFn: async () => {
      const res = await api.get('/room-rentals', { params: filters });
      return res.data as RoomRental[];
    }
  });

  const createRental = useMutation({
    mutationFn: async (rentalData: Partial<RoomRental>) => {
      const { data } = await api.post('/room-rentals', rentalData);
      return data as RoomRental;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomRentals'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    }
  });

  const editListing = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<RoomRental> }) => {
      const res = await api.put(`/room-rentals/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomRentals'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    }
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/room-rentals/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomRentals'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    }
  });

  const sendInquiry = useMutation({
    mutationFn: async (data: { roomId: string; message: string; moveInDate?: string }) => {
      const res = await api.post('/room-rentals/inquiries', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentInquiries'] });
    }
  });

  const updateInquiryStatus = useMutation({
    mutationFn: async ({ inquiryId, status, replyMessage }: { inquiryId: string; status: string; replyMessage?: string }) => {
      const res = await api.put(`/room-rentals/inquiries/${inquiryId}/status`, { status, replyMessage });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedInquiries'] });
    }
  });

  const getSentInquiries = useQuery({
    queryKey: ['sentInquiries'],
    queryFn: async () => {
      const res = await api.get('/room-rentals/inquiries/sent');
      return res.data as RoomInquiry[];
    }
  });

  const getReceivedInquiries = useQuery({
    queryKey: ['receivedInquiries'],
    queryFn: async () => {
      const res = await api.get('/room-rentals/inquiries/received');
      return res.data as RoomInquiry[];
    }
  });

  const getMyListings = useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const res = await api.get('/room-rentals/me/listings');
      return res.data as RoomRental[];
    }
  });

  const getSavedListings = useQuery({
    queryKey: ['savedListings'],
    queryFn: async () => {
      const res = await api.get('/room-rentals/me/saved');
      return res.data as RoomRental[];
    }
  });

  const saveListing = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await api.post(`/room-rentals/${roomId}/save`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
    }
  });

  const unsaveListing = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await api.delete(`/room-rentals/${roomId}/save`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
    }
  });

  const requestVerification = useMutation({
    mutationFn: async ({ roomId, proofUrl }: { roomId: string, proofUrl: string }) => {
      const res = await api.post(`/room-rentals/${roomId}/verify`, { proofUrl });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    }
  });

  const reportListing = useMutation({
    mutationFn: async ({ roomId, reason }: { roomId: string; reason: string }) => {
      const res = await api.post(`/room-rentals/${roomId}/report`, { reason });
      return res.data;
    }
  });

  // ADMIN HOOKS
  const getAdminListings = useQuery({
    queryKey: ['adminRoomRentals'],
    queryFn: async () => {
      const res = await api.get('/room-rentals/admin/all');
      return res.data as RoomRental[];
    }
  });

  const adminVerifyListing = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: 'Verified' | 'Rejected' | 'None' }) => {
      const res = await api.put(`/room-rentals/${roomId}/verify/admin`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoomRentals'] });
    }
  });

  const adminDeleteListing = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await api.delete(`/room-rentals/${roomId}/admin`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoomRentals'] });
    }
  });

  return { 
    getRentals, createRental, sendInquiry, updateInquiryStatus, 
    getSentInquiries, getReceivedInquiries,
    getMyListings, getSavedListings, saveListing, unsaveListing, requestVerification,
    reportListing,
    getAdminListings,
    adminVerifyListing,
    adminDeleteListing,
    editListing,
    deleteListing
  };
};
