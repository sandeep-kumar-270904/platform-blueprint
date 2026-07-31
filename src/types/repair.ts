export type RepairCategory = "all" | "electronics" | "plumbing" | "electrical" | "handyman" | "cleaning" | "saved";

export type AvailabilityStatus = "Open now" | "Closed" | "Usually responds within 2 hours" | "Available 24/7";

export interface OperatingHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface RepairReview {
  id: string;
  providerId: string;
  userId: {
    _id: string;
    username: string;
    full_name: string;
    profile_picture?: string;
  } | string;
  rating: number;
  comment: string;
  helpfulCount: number;
  flagsCount: number;
  createdAt: string;
}

export interface GalleryItem {
  _id: string;
  imageUrl: string;
  type: 'single' | 'before' | 'after';
  groupId?: string;
  caption?: string;
  category?: string;
  order: number;
  createdAt: string;
}

export interface ServiceListing {
  id: string;
  name: string;
  category: string;
  description: string;
  services: string[];
  priceIndicator: string;
  basePrice: number;
  location: {
    address: string;
    coordinates?: number[];
  };
  contact: {
    phone?: string;
    email?: string;
  };
  availability?: string;
  operatingHours?: OperatingHours[];
  rating: number;
  reviewsCount: number;
  verification?: {
    isVerified: boolean;
    businessRegistration?: boolean;
    phoneNumber?: boolean;
    address?: boolean;
  };
  reputationStats?: {
    responseRate?: number;
    responseTimeHours?: number;
  };
  handlesEmergencies?: boolean;
  gallery?: GalleryItem[];
  completedJobsCount?: number | null;
  isSaved?: boolean;
  schedulingConfig?: {
    slotDurationMinutes: number;
    maxAdvanceBookingDays: number;
  };
}

export type RequestStatus = "Pending" | "Accepted" | "In Progress" | "Completed" | "Cancelled";

export interface RepairRequest {
  id: string;
  providerId: string;
  providerName: string;
  userId: string;
  issueDescription: string;
  category: string;
  preferredDate: string;
  preferredTime: string; // or 'ASAP'
  contactPhone: string;
  status: RequestStatus;
  isUrgent?: boolean;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface QuoteResponse {
  _id: string;
  quoteRequestId: string;
  providerId: {
    _id: string;
    name: string;
    rating: number;
    reviewsCount: number;
    category: string;
  };
  priceEstimate: string;
  estimatedTimeframe: string;
  note: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

export interface QuoteRequest {
  _id: string;
  userId: string;
  category: string;
  issueDescription: string;
  budgetRange?: string;
  photoUrl?: string;
  isUrgent: boolean;
  status: 'Open' | 'Closed' | 'Completed' | 'Cancelled';
  quotesReceivedCount: number;
  responses?: QuoteResponse[];
  createdAt: string;
}
