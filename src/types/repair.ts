export type RepairCategory = "all" | "electronics" | "plumbing" | "electrical" | "handyman" | "cleaning";

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
}
