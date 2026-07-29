const mongoose = require('mongoose');
const dotenv = require('dotenv');
const College = require('./models/College');
const Review = require('./models/Review');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const colleges = [
  {
    name: "Indian Institute of Technology Bombay",
    location: { city: "Mumbai", state: "Maharashtra" },
    type: "IIT",
    logoOrIcon: "🎓",
    establishedYear: 1958,
    website: "https://www.iitb.ac.in",
    fees: { tuition: 200000, hostel: 45000, other: 15000 },
    avgPackage: "₹21.82 LPA",
    highestPackage: "₹3.67 CPA",
    placementPercentage: 92,
    rating: 4.9,
    totalReviews: 850,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 171, eligibility: "JEE Advanced" },
      { name: "B.Tech Electrical Engineering", duration: "4 Years", seats: 120, eligibility: "JEE Advanced" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Gym"],
    accreditation: "NIRF Rank 3",
    admissionProcess: "Admission is based on JEE Advanced rank followed by JoSAA counseling.",
    images: ["https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Indian Institute of Technology Delhi",
    location: { city: "New Delhi", state: "Delhi" },
    type: "IIT",
    logoOrIcon: "🏛️",
    establishedYear: 1961,
    website: "https://home.iitd.ac.in",
    fees: { tuition: 200000, hostel: 40000, other: 12000 },
    avgPackage: "₹20.50 LPA",
    highestPackage: "₹2.50 CPA",
    placementPercentage: 95,
    rating: 4.8,
    totalReviews: 780,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 110, eligibility: "JEE Advanced" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs"],
    accreditation: "NIRF Rank 2",
    admissionProcess: "Admission is based on JEE Advanced rank.",
    images: ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Indian Institute of Technology Madras",
    location: { city: "Chennai", state: "Tamil Nadu" },
    type: "IIT",
    logoOrIcon: "🎓",
    establishedYear: 1959,
    website: "https://www.iitm.ac.in",
    fees: { tuition: 200000, hostel: 35000, other: 10000 },
    avgPackage: "₹21.48 LPA",
    highestPackage: "₹1.98 CPA",
    placementPercentage: 93,
    rating: 4.9,
    totalReviews: 690,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 87, eligibility: "JEE Advanced" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Gym", "Hospital"],
    accreditation: "NIRF Rank 1",
    admissionProcess: "Admission is based on JEE Advanced rank.",
    images: ["https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Birla Institute of Technology and Science, Pilani",
    location: { city: "Pilani", state: "Rajasthan" },
    type: "Private",
    logoOrIcon: "🏛️",
    establishedYear: 1964,
    website: "https://www.bits-pilani.ac.in",
    fees: { tuition: 571500, hostel: 45000, other: 30000 },
    avgPackage: "₹30.37 LPA",
    highestPackage: "₹60.75 LPA",
    placementPercentage: 96,
    rating: 4.7,
    totalReviews: 1200,
    coursesOffered: [
      { name: "B.E. Computer Science", duration: "4 Years", seats: 150, eligibility: "BITSAT" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Incubation Center"],
    accreditation: "NIRF Rank 25",
    admissionProcess: "Admission is strictly based on merit in the BITSAT exam.",
    images: ["https://images.unsplash.com/photo-1560252829-804f1aedf1be?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "National Institute of Technology, Tiruchirappalli",
    location: { city: "Tiruchirappalli", state: "Tamil Nadu" },
    type: "NIT",
    logoOrIcon: "🎓",
    establishedYear: 1964,
    website: "https://www.nitt.edu",
    fees: { tuition: 125000, hostel: 30000, other: 15000 },
    avgPackage: "₹15.80 LPA",
    highestPackage: "₹52.89 LPA",
    placementPercentage: 94,
    rating: 4.6,
    totalReviews: 850,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 115, eligibility: "JEE Main" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Gym"],
    accreditation: "NIRF Rank 9",
    admissionProcess: "Admission is based on JEE Main rank followed by JoSAA/CSAB counseling.",
    images: ["https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Vellore Institute of Technology",
    location: { city: "Vellore", state: "Tamil Nadu" },
    type: "Private",
    logoOrIcon: "🏢",
    establishedYear: 1984,
    website: "https://vit.ac.in",
    fees: { tuition: 198000, hostel: 100000, other: 15000 },
    avgPackage: "₹9.23 LPA",
    highestPackage: "₹1.02 CPA",
    placementPercentage: 91,
    rating: 4.2,
    totalReviews: 3200,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 1000, eligibility: "VITEEE" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Gym", "Food Court"],
    accreditation: "NIRF Rank 11",
    admissionProcess: "Admission is based on merit in the VITEEE exam.",
    images: ["https://images.unsplash.com/photo-1525926472856-cbdf2a16d552?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Indian Institute of Technology Kanpur",
    location: { city: "Kanpur", state: "Uttar Pradesh" },
    type: "IIT",
    logoOrIcon: "🎓",
    establishedYear: 1959,
    website: "https://www.iitk.ac.in",
    fees: { tuition: 200000, hostel: 32000, other: 18000 },
    avgPackage: "₹22.50 LPA",
    highestPackage: "₹1.90 CPA",
    placementPercentage: 92,
    rating: 4.8,
    totalReviews: 610,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 95, eligibility: "JEE Advanced" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Airstrip"],
    accreditation: "NIRF Rank 4",
    admissionProcess: "Admission is based on JEE Advanced rank.",
    images: ["https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Indian Institute of Technology Kharagpur",
    location: { city: "Kharagpur", state: "West Bengal" },
    type: "IIT",
    logoOrIcon: "🏛️",
    establishedYear: 1951,
    website: "http://www.iitkgp.ac.in",
    fees: { tuition: 200000, hostel: 35000, other: 14000 },
    avgPackage: "₹20.10 LPA",
    highestPackage: "₹2.68 CPA",
    placementPercentage: 90,
    rating: 4.7,
    totalReviews: 920,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 80, eligibility: "JEE Advanced" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Gym", "Hospital"],
    accreditation: "NIRF Rank 6",
    admissionProcess: "Admission is based on JEE Advanced rank.",
    images: ["https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "National Institute of Technology Karnataka",
    location: { city: "Surathkal", state: "Karnataka" },
    type: "NIT",
    logoOrIcon: "🎓",
    establishedYear: 1960,
    website: "https://www.nitk.ac.in",
    fees: { tuition: 125000, hostel: 35000, other: 10000 },
    avgPackage: "₹18.26 LPA",
    highestPackage: "₹54.75 LPA",
    placementPercentage: 93,
    rating: 4.5,
    totalReviews: 540,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 115, eligibility: "JEE Main" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Private Beach", "Wi-Fi Campus", "Labs"],
    accreditation: "NIRF Rank 12",
    admissionProcess: "Admission is based on JEE Main rank.",
    images: ["https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "National Institute of Technology Warangal",
    location: { city: "Warangal", state: "Telangana" },
    type: "NIT",
    logoOrIcon: "🏛️",
    establishedYear: 1959,
    website: "https://www.nitw.ac.in",
    fees: { tuition: 125000, hostel: 32000, other: 12000 },
    avgPackage: "₹17.29 LPA",
    highestPackage: "₹88.00 LPA",
    placementPercentage: 92,
    rating: 4.6,
    totalReviews: 610,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 135, eligibility: "JEE Main" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs"],
    accreditation: "NIRF Rank 21",
    admissionProcess: "Admission is based on JEE Main rank.",
    images: ["https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Manipal Institute of Technology",
    location: { city: "Manipal", state: "Karnataka" },
    type: "Private",
    logoOrIcon: "🏢",
    establishedYear: 1957,
    website: "https://manipal.edu/mit.html",
    fees: { tuition: 335000, hostel: 110000, other: 25000 },
    avgPackage: "₹12.59 LPA",
    highestPackage: "₹54.75 LPA",
    placementPercentage: 88,
    rating: 4.4,
    totalReviews: 1100,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 200, eligibility: "MET" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Food Court", "Innovation Center"],
    accreditation: "NIRF Rank 61",
    admissionProcess: "Admission is based on Manipal Entrance Test (MET) rank.",
    images: ["https://images.unsplash.com/photo-1519452311452-16b77c688d55?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Delhi Technological University",
    location: { city: "New Delhi", state: "Delhi" },
    type: "State",
    logoOrIcon: "🎓",
    establishedYear: 1941,
    website: "http://www.dtu.ac.in",
    fees: { tuition: 219000, hostel: 40000, other: 15000 },
    avgPackage: "₹15.16 LPA",
    highestPackage: "₹1.80 CPA",
    placementPercentage: 85,
    rating: 4.5,
    totalReviews: 950,
    coursesOffered: [
      { name: "B.Tech Computer Engineering", duration: "4 Years", seats: 480, eligibility: "JEE Main" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs"],
    accreditation: "NIRF Rank 29",
    admissionProcess: "Admission is based on JEE Main rank through JAC Delhi counseling.",
    images: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "Jadavpur University",
    location: { city: "Kolkata", state: "West Bengal" },
    type: "State",
    logoOrIcon: "🏛️",
    establishedYear: 1955,
    website: "http://www.jaduniv.edu.in",
    fees: { tuition: 2400, hostel: 15000, other: 5000 },
    avgPackage: "₹10.20 LPA",
    highestPackage: "₹1.80 CPA",
    placementPercentage: 84,
    rating: 4.6,
    totalReviews: 720,
    coursesOffered: [
      { name: "B.E. Computer Science", duration: "4 Years", seats: 64, eligibility: "WBJEE" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Open Air Theatre"],
    accreditation: "NIRF Rank 10",
    admissionProcess: "Admission is based on WBJEE rank.",
    images: ["https://images.unsplash.com/photo-1588693836756-11f49615a676?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "International Institute of Information Technology, Hyderabad",
    location: { city: "Hyderabad", state: "Telangana" },
    type: "Private",
    logoOrIcon: "🎓",
    establishedYear: 1998,
    website: "https://www.iiit.ac.in",
    fees: { tuition: 360000, hostel: 45000, other: 20000 },
    avgPackage: "₹32.20 LPA",
    highestPackage: "₹74.00 LPA",
    placementPercentage: 100,
    rating: 4.8,
    totalReviews: 450,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 120, eligibility: "JEE Main / UGEE" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Research Centers"],
    accreditation: "NIRF Rank 55",
    admissionProcess: "Admission via JEE Main, UGEE, or Olympiads.",
    images: ["https://images.unsplash.com/photo-1555431189-0af5d0fdf1d5?auto=format&fit=crop&q=80&w=1000"]
  },
  {
    name: "SRM Institute of Science and Technology",
    location: { city: "Chennai", state: "Tamil Nadu" },
    type: "Private",
    logoOrIcon: "🏢",
    establishedYear: 1985,
    website: "https://www.srmist.edu.in",
    fees: { tuition: 300000, hostel: 110000, other: 20000 },
    avgPackage: "₹7.58 LPA",
    highestPackage: "₹1.00 CPA",
    placementPercentage: 90,
    rating: 4.0,
    totalReviews: 2800,
    coursesOffered: [
      { name: "B.Tech Computer Science", duration: "4 Years", seats: 1200, eligibility: "SRMJEEE" }
    ],
    facilities: ["Hostel", "Library", "Sports Complex", "Wi-Fi Campus", "Labs", "Gym", "Hospital"],
    accreditation: "NIRF Rank 18",
    admissionProcess: "Admission is based on SRMJEEE rank.",
    images: ["https://images.unsplash.com/photo-1546410531-bea4cada20f2?auto=format&fit=crop&q=80&w=1000"]
  }
];

const connectDB = require('./db');

const seedDB = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected via db.js");

    await College.deleteMany({});
    console.log("Cleared existing colleges");

    await College.insertMany(colleges);
    console.log("Successfully seeded 15 colleges");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
