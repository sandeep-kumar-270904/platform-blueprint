const mongoose = require('mongoose');

const awardeeStorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScholarshipApplication', required: true },
  narrative: { type: String, required: true },
  showRealName: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String }
}, { timestamps: true });

awardeeStorySchema.index({ scholarshipId: 1, status: 1 });

module.exports = mongoose.model('AwardeeStory', awardeeStorySchema);
