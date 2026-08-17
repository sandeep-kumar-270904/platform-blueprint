const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  branchOfInterest: { type: String, required: true },
  budgetRange: { type: String, required: true },
  locationPreference: { type: String, required: true },
  priorities: [{ type: String }],
  currentAcademicStanding: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
