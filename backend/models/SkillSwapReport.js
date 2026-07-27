const mongoose = require('mongoose');

const skillSwapReportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['offer', 'user', 'session', 'circle'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['SkillOffer', 'User', 'SkillSession', 'SkillCircle']
  },
  reason: {
    type: String,
    enum: ['no-show', 'inappropriate-content', 'spam', 'harassment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'reviewing', 'resolved', 'dismissed'],
    default: 'open'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String
  }
}, {
  timestamps: true
});

skillSwapReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SkillSwapReport', skillSwapReportSchema);
