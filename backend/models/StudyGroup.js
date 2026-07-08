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
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Virtual property for member_count
studyGroupSchema.virtual('member_count').get(function() {
  return this.members.length;
});

// Ensure virtuals are included in JSON/Object conversions
studyGroupSchema.set('toJSON', { virtuals: true });
studyGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
