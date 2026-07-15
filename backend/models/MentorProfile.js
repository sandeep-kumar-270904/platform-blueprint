const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  title: { type: String, required: true, trim: true },
  company: { type: String, default: null, trim: true },
  bio: { type: String, default: null },
  expertise: [{ type: String, trim: true }],
  yearsOfExperience: { type: Number, default: 0 },
  languages: [{ type: String, trim: true }],
  pricePerHour: { type: Number, default: 0 }, // 0 means free
  currency: { type: String, default: 'INR' },
  sessionTypes: [{ type: String, enum: ['1-on-1', 'AMA'], default: ['1-on-1'] }],
  availabilityRules: {
    // Array of available days/times (e.g. { day: 'Monday', startTime: '18:00', endTime: '20:00' })
    weekly: [{
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      startTime: String, // HH:mm format
      endTime: String
    }],
    blackoutDates: [Date] // specific dates they are not available
  },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: null },
  socialLinks: {
    linkedin: String,
    portfolio: String,
    github: String,
    twitter: String
  },
  isActive: { type: Boolean, default: true } // false if they unpublish their profile
}, { timestamps: true });

// Indexes for fast lookup
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ verificationStatus: 1 });
mentorProfileSchema.index({ user_id: 1 });
mentorProfileSchema.index({ pricePerHour: 1 });
mentorProfileSchema.index({ rating: -1 });

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);
