const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  category: { type: String, default: null },
  member_limit: { type: Number, default: 50 },
  active_room_count: { type: Number, default: 0 },
  banner_url: { type: String, default: null },
  memberships: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'pending', 'removed'], default: 'active' },
    joined_at: { type: Date, default: Date.now }
  }],
  active_challenge_id: { type: String, default: null },
  shared_resources: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    added_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Virtual property for member_count
studyGroupSchema.virtual('member_count').get(function() {
  return this.memberships ? this.memberships.filter(m => m.status === 'active').length : 0;
});

// Ensure virtuals are included in JSON/Object conversions
studyGroupSchema.set('toJSON', { virtuals: true });
studyGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
