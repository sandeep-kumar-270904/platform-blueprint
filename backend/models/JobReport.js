const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  targetType: { 
    type: String, 
    enum: ['job'], 
    required: true 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Job'],
    default: 'Job'
  },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    enum: ['spam', 'fraud_scam', 'misleading', 'discriminatory', 'other'],
    required: true
  },
  details: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed_actioned', 'reviewed_dismissed'], 
    default: 'pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  adminNote: { type: String }
}, { timestamps: true });

// Prevent duplicate reporting
reportSchema.index({ targetType: 1, targetId: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('JobReport', reportSchema);
