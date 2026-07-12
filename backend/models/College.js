const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: String, required: true },
  seats: { type: Number, required: true },
  eligibility: { type: String, required: true }
});

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['IIT', 'NIT', 'Private', 'State', 'Central'],
    required: true
  },
  logoOrIcon: { type: String, default: '🏛️' },
  establishedYear: { type: Number },
  website: { type: String },
  officialEmailDomain: { type: String },
  fees: {
    tuition: { type: Number, required: true },
    hostel: { type: Number, required: true },
    other: { type: Number, default: 0 }
  },
  avgPackage: { type: String },
  highestPackage: { type: String },
  placementPercentage: { type: Number },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  avgHostelRating: { type: Number, default: 0 },
  avgLabsRating: { type: Number, default: 0 },
  avgFacultyRating: { type: Number, default: 0 },
  avgCampusLifeRating: { type: Number, default: 0 },
  avgPlacementsRating: { type: Number, default: 0 },
  avgAcademicsRating: { type: Number, default: 0 },
  avgInfrastructureRating: { type: Number, default: 0 },
  coursesOffered: [CourseSchema],
  facilities: [{ type: String }],
  accreditation: { type: String },
  admissionProcess: { type: String },
  images: [{ type: String }],
  draft: { type: Boolean, default: false } // For admin toggle visibility
}, {
  timestamps: true
});

module.exports = mongoose.model('College', CollegeSchema);
