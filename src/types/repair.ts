export type RepairCategory = "all" | "electronics" | "plumbing" | "electrical" | "handyman" | "cleaning";

export type AvailabilityStatus = "Open now" | "Closed" | "Usually responds within 2 hours" | "Available 24/7";

export interface ServiceListing {
  id: string;
  name: string;
  category: RepairCategory;
  description: string;
  rating: number;
  reviews: number;
  priceIndicator: string;
  location: string;
  availability: AvailabilityStatus;
  phone: string;
  services: string[];
}
