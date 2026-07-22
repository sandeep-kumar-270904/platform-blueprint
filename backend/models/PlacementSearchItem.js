const mongoose = require('mongoose');

const placementSearchItemSchema = new mongoose.Schema({
  moduleType: { 
    type: String, 
    enum: ['company', 'dsa', 'interview', 'aptitude', 'group', 'qa', 'referrer', 'mock_interviewer'], 
    required: true 
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String },
  matchTags: [{ type: String }],
  companyTags: [{ type: String }],
  visibility: { 
    type: String, 
    enum: ['Public', 'InviteOnly', 'PendingReview'], 
    default: 'Public' 
  },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Create text index for primary search
placementSearchItemSchema.index(
  { title: 'text', description: 'text', matchTags: 'text', companyTags: 'text' },
  { weights: { title: 10, matchTags: 5, companyTags: 5, description: 1 } }
);

// Create compound index for fast lookups by module and reference
placementSearchItemSchema.index({ moduleType: 1, referenceId: 1 }, { unique: true });

module.exports = mongoose.model('PlacementSearchItem', placementSearchItemSchema);
