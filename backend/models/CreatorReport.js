const mongoose = require('mongoose');

const creatorReportSchema = new mongoose.Schema({
  reporterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  targetType: { 
    type: String, 
    enum: ['content', 'comment'], 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'actioned'], 
    default: 'pending' 
  }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

// Enforce one report per user per target at the DB index level
creatorReportSchema.index({ reporterId: 1, targetId: 1 }, { unique: true });
creatorReportSchema.index({ targetId: 1, status: 1 });
creatorReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CreatorReport', creatorReportSchema);
