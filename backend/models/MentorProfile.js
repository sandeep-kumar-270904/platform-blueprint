const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, default: null },
  bio: { type: String, default: null },
  expertise: [{ type: String }],
  languages: [{ type: String }],
  price_per_hour: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews_count: { type: Number, default: 0 },
  sessions_count: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  availability_text: { type: String, default: null },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);
