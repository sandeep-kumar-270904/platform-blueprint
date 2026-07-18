const mongoose = require('mongoose');

const scholarshipApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true,
  },
  // the status tracks both in_app depth and external_link lightweight tracking
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'awarded', 'rejected', 'withdrawn', 'link_opened'],
    default: 'draft',
  },
  // Array of responses to the custom inAppRequirements
  responses: [{
    fieldKey: { type: String },
    value: { type: mongoose.Schema.Types.Mixed }
  }],
  essayResponses: [{
    prompt: { type: String },
    response: { type: String }
  }],
  // Reference to Resume snapshot pattern if they attach a resume
  attachedResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  submittedAt: {
    type: Date,
  },
  decisionAt: {
    type: Date,
  }
}, { timestamps: true });

scholarshipApplicationSchema.index({ userId: 1, scholarshipId: 1 }, { unique: true });

module.exports = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);
