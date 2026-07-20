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
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'awarded', 'rejected', 'withdrawn', 'link_opened'],
    default: 'draft',
  },
  responses: [{
    fieldKey: { type: String },
    value: { type: mongoose.Schema.Types.Mixed }
  }],
  essayResponses: [{
    fieldKey: { type: String },
    prompt: { type: String },
    response: { type: String }
  }],
  attachedResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  resumeSnapshot: {
    type: Object, // full resume content snapshotted at submission time
  },
  attachedLetterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecommendationLetter',
  },
  letterSnapshot: {
    type: Object, // full letter content snapshotted at submission time
  },
  documentUploads: [{
    fieldKey: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  }],
  submittedAt: {
    type: Date,
  },
  decisionAt: {
    type: Date,
  }
}, { timestamps: true });

scholarshipApplicationSchema.index({ userId: 1, scholarshipId: 1 }, { unique: true });
scholarshipApplicationSchema.index({ userId: 1, status: 1 });
scholarshipApplicationSchema.index({ scholarshipId: 1, status: 1 });

module.exports = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);
