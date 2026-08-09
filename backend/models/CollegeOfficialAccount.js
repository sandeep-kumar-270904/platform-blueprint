const mongoose = require('mongoose');

const collegeOfficialAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  role: { type: String, enum: ['admin', 'representative'], default: 'representative' },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  proofDocumentUrl: { type: String }, // e.g., ID card or official letter
  officialEmail: { type: String, required: true }, // must match college domain ideally
}, { timestamps: true });

collegeOfficialAccountSchema.index({ userId: 1, collegeId: 1 }, { unique: true });

module.exports = mongoose.model('CollegeOfficialAccount', collegeOfficialAccountSchema);
