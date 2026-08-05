import { ServiceListing, RepairCategory } from "../types/repair";

export const mockServices: ServiceListing[] = [
  {
    id: "1",
    name: "ElectroFix Pros",
    category: "electronics",
    description: "Expert laptop, mobile, and gadget repairs. Screen replacements in 30 minutes.",
    rating: 4.8,
    reviews: 124,
    priceIndicator: "Starting from $30",
    location: "North Campus, Bldg 4",
    availability: "Open now",
    phone: "+1 234-567-8900",
    services: ["Laptops", "Smartphones", "Data Recovery"]
  },
  {
    id: "2",
    name: "Campus Plumbers",
    category: "plumbing",
    description: "Quick response plumbing services for dorms and apartments. Leaks, clogs, and installations.",
    rating: 4.5,
    reviews: 89,
    priceIndicator: "Starting from $50",
    location: "Downtown / Campus Area",
    availability: "Available 24/7",
    phone: "+1 234-567-8901",
    services: ["Pipe Leaks", "Drain Cleaning", "Installations"]
  },
  {
    id: "3",
    name: "Sparky Electricals",
    category: "electrical",
    description: "Licensed electricians. We handle short circuits, appliance repairs, and wiring issues.",
    rating: 4.9,
    reviews: 210,
    priceIndicator: "Starting from $40",
    location: "Westside Hub",
    availability: "Closed",
    phone: "+1 234-567-8902",
    services: ["Wiring", "Appliance Repair", "Lighting"]
  },
  {
    id: "4",
    name: "Tech Haven Repairs",
    category: "electronics",
    description: "We fix what others can't. Motherboard repairs, water damage, and console repairs.",
    rating: 4.6,
    reviews: 56,
    priceIndicator: "Starting from $45",
    location: "South Campus Mall",
    availability: "Open now",
    phone: "+1 234-567-8903",
    services: ["Consoles", "Motherboards", "Tablets"]
  },
  {
    id: "5",
    name: "Quick Fix Handyman",
    category: "handyman",
    description: "Furniture assembly, mounting TVs, door locks, and general maintenance tasks.",
    rating: 4.7,
    reviews: 142,
    priceIndicator: "Starting from $25",
    location: "Serves Entire City",
    availability: "Usually responds within 2 hours",
    phone: "+1 234-567-8904",
    services: ["Furniture Assembly", "Mounting", "Locks"]
  },
  {
    id: "6",
    name: "AquaFlow Plumbing",
    category: "plumbing",
    description: "Affordable student rates for basic plumbing fixes. No hidden charges.",
    rating: 4.3,
    reviews: 45,
    priceIndicator: "Starting from $35",
    location: "East Campus",
    availability: "Open now",
    phone: "+1 234-567-8905",
    services: ["Toilets", "Faucets", "Clogs"]
  },
  {
    id: "7",
    name: "Bright Lights Electrical",
    category: "electrical",
    description: "Fast and reliable electrical troubleshooting. Student discount available.",
    rating: 4.4,
    reviews: 78,
    priceIndicator: "Starting from $40",
    location: "North Campus, Bldg 2",
    availability: "Usually responds within 2 hours",
    phone: "+1 234-567-8906",
    services: ["Troubleshooting", "Outlets", "Fans"]
  },
  {
    id: "8",
    name: "CleanSweep Services",
    category: "cleaning",
    description: "Deep cleaning for dorms and apartments. Move-out cleaning specials.",
    rating: 4.9,
    reviews: 320,
    priceIndicator: "Starting from $60",
    location: "Downtown",
    availability: "Open now",
    phone: "+1 234-567-8907",
    services: ["Deep Clean", "Move-out", "Weekly"]
  },
  {
    id: "9",
    name: "Mobile Medic",
    category: "electronics",
    description: "We come to you! On-the-spot screen and battery replacements for iPhones and Androids.",
    rating: 4.8,
    reviews: 189,
    priceIndicator: "Starting from $40",
    location: "Mobile Service",
    availability: "Open now",
    phone: "+1 234-567-8908",
    services: ["Screens", "Batteries", "On-site"]
  },
  {
    id: "10",
    name: "Dorm Doctor Handyman",
    category: "handyman",
    description: "Specializing in quick fixes for student housing. Wall patching, painting, and blind repair.",
    rating: 4.5,
    reviews: 92,
    priceIndicator: "Starting from $20",
    location: "Campus Area",
    availability: "Closed",
    phone: "+1 234-567-8909",
    services: ["Wall Patching", "Painting", "Blinds"]
  },
  {
    id: "11",
    name: "Volt Masters",
    category: "electrical",
    description: "Heavy duty electrical repairs. Certified contractors with 10+ years experience.",
    rating: 4.7,
    reviews: 64,
    priceIndicator: "Starting from $80",
    location: "Westside Hub",
    availability: "Usually responds within 2 hours",
    phone: "+1 234-567-8910",
    services: ["Heavy Duty", "Rewiring", "Panels"]
  },
  {
    id: "12",
    name: "PC Builders & Repair",
    category: "electronics",
    description: "Custom PC builds, hardware upgrades, and software troubleshooting.",
    rating: 5.0,
    reviews: 312,
    priceIndicator: "Starting from $50",
    location: "South Campus Mall",
    availability: "Open now",
    phone: "+1 234-567-8911",
    services: ["Custom PCs", "Upgrades", "Software"]
  }
];

export type SortOption = "top_rated" | "nearest" | "price_low";

export const fetchMockServices = async (
  category: RepairCategory,
  sortBy: SortOption,
  page: number,
  limit: number = 6
): Promise<{ data: ServiceListing[], totalPages: number }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Filter by category
  let filtered = mockServices;
  if (category !== "all") {
    filtered = mockServices.filter(s => s.category === category);
  }

  // Sort
  if (sortBy === "top_rated") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "price_low") {
    // Basic string parse for mock price sorting
    const getPrice = (str: string) => {
      const match = str.match(/\$(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    filtered.sort((a, b) => getPrice(a.priceIndicator) - getPrice(b.priceIndicator));
  } else if (sortBy === "nearest") {
    // Mock nearest sort - randomly shuffling for simulation if we don't have real coords, 
    // or just leave it for now. We'll simulate by sorting alphabetically by location to make it deterministic.
    filtered.sort((a, b) => a.location.localeCompare(b.location));
  }

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalPages: Math.ceil(filtered.length / limit)
  };
};
