const mongoose = require('mongoose');

const communityFollowSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
}, { timestamps: true });

// Ensure a user can only follow a specific target once
communityFollowSchema.index({ followerId: 1, targetCollegeId: 1, targetUserId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityFollow', communityFollowSchema);
