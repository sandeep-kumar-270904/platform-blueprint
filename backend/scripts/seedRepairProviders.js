const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RepairProvider = require('../models/RepairProvider');
const RepairReview = require('../models/RepairReview');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mockServices = [
  {
    name: "ElectroFix Pros",
    category: "electronics",
    description: "Expert laptop, mobile, and gadget repairs. Screen replacements in 30 minutes.",
    priceIndicator: "Starting from $30",
    basePrice: 30,
    location: {
      address: "North Campus, Bldg 4",
      coordinates: [-118.243683, 34.052235] // LA example
    },
    manualStatusOverride: "Open now",
    contact: { phone: "+1 234-567-8900" },
    services: ["Laptops", "Smartphones", "Data Recovery"],
    rating: 4.8,
    reviewsCount: 124
  },
  {
    name: "Campus Plumbers",
    category: "plumbing",
    description: "Quick response plumbing services for dorms and apartments. Leaks, clogs, and installations.",
    priceIndicator: "Starting from $50",
    basePrice: 50,
    location: {
      address: "Downtown / Campus Area",
      coordinates: [-118.25, 34.05] 
    },
    manualStatusOverride: "Available 24/7",
    contact: { phone: "+1 234-567-8901" },
    services: ["Pipe Leaks", "Drain Cleaning", "Installations"],
    rating: 4.5,
    reviewsCount: 89
  },
  {
    name: "Sparky Electricals",
    category: "electrical",
    description: "Licensed electricians. We handle short circuits, appliance repairs, and wiring issues.",
    priceIndicator: "Starting from $40",
    basePrice: 40,
    location: {
      address: "Westside Hub",
      coordinates: [-118.3, 34.06]
    },
    manualStatusOverride: "Closed",
    contact: { phone: "+1 234-567-8902" },
    services: ["Wiring", "Appliance Repair", "Lighting"],
    rating: 4.9,
    reviewsCount: 210
  },
  {
    name: "Tech Haven Repairs",
    category: "electronics",
    description: "We fix what others can't. Motherboard repairs, water damage, and console repairs.",
    priceIndicator: "Starting from $45",
    basePrice: 45,
    location: {
      address: "South Campus Mall",
      coordinates: [-118.2, 34.04]
    },
    manualStatusOverride: "Open now",
    contact: { phone: "+1 234-567-8903" },
    services: ["Consoles", "Motherboards", "Tablets"],
    rating: 4.6,
    reviewsCount: 56
  },
  {
    name: "Quick Fix Handyman",
    category: "handyman",
    description: "Furniture assembly, mounting TVs, door locks, and general maintenance tasks.",
    priceIndicator: "Starting from $25",
    basePrice: 25,
    location: {
      address: "Serves Entire City",
      coordinates: [-118.26, 34.055]
    },
    manualStatusOverride: "Usually responds within 2 hours",
    contact: { phone: "+1 234-567-8904" },
    services: ["Furniture Assembly", "Mounting", "Locks"],
    rating: 4.7,
    reviewsCount: 142
  },
  {
    name: "AquaFlow Plumbing",
    category: "plumbing",
    description: "Affordable student rates for basic plumbing fixes. No hidden charges.",
    priceIndicator: "Starting from $35",
    basePrice: 35,
    location: {
      address: "East Campus",
      coordinates: [-118.22, 34.045]
    },
    manualStatusOverride: "Open now",
    contact: { phone: "+1 234-567-8905" },
    services: ["Toilets", "Faucets", "Clogs"],
    rating: 4.3,
    reviewsCount: 45
  },
  {
    name: "Bright Lights Electrical",
    category: "electrical",
    description: "Fast and reliable electrical troubleshooting. Student discount available.",
    priceIndicator: "Starting from $40",
    basePrice: 40,
    location: {
      address: "North Campus, Bldg 2",
      coordinates: [-118.245, 34.053]
    },
    manualStatusOverride: "Usually responds within 2 hours",
    contact: { phone: "+1 234-567-8906" },
    services: ["Troubleshooting", "Outlets", "Fans"],
    rating: 4.4,
    reviewsCount: 78
  },
  {
    name: "CleanSweep Services",
    category: "cleaning",
    description: "Deep cleaning for dorms and apartments. Move-out cleaning specials.",
    priceIndicator: "Starting from $60",
    basePrice: 60,
    location: {
      address: "Downtown",
      coordinates: [-118.248, 34.048]
    },
    manualStatusOverride: "Open now",
    contact: { phone: "+1 234-567-8907" },
    services: ["Deep Clean", "Move-out", "Weekly"],
    rating: 4.9,
    reviewsCount: 320
  }
];

const seedProviders = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/studenthub';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');

    // Delete existing
    await RepairProvider.deleteMany();
    await RepairReview.deleteMany();
    console.log('Existing providers and reviews deleted.');

    // Insert mock
    await RepairProvider.insertMany(mockServices);
    console.log('Mock providers inserted.');

    console.log('Seeding Success!');
    process.exit();
  } catch (error) {
    console.error('Error with seeding data:', error);
    process.exit(1);
  }
};

seedProviders();
