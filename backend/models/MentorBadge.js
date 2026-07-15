const mongoose = require('mongoose');

const mentorBadgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Top Rated", "Rising Mentor", "Elite"
  description: { type: String, required: true },
  iconUrl: { type: String, required: true },
  
  // Rule configuration (can be extended)
  criteria: {
    minRating: { type: Number, default: 0 },
    minSessions: { type: Number, default: 0 },
    maxDaysSinceJoin: { type: Number, default: null }, // for "Rising Mentor" (e.g. 30)
    minResponseRate: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('MentorBadge', mentorBadgeSchema);
