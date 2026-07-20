const mongoose = require('mongoose');

const communityPollVoteSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  option_index: { type: Number, required: true }
}, { timestamps: true });

// Ensure one vote per user per post poll
communityPollVoteSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('CommunityPollVote', communityPollVoteSchema);
