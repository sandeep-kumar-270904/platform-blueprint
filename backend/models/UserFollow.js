const mongoose = require('mongoose');

const userFollowSchema = new mongoose.Schema({
  follower_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  followed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

userFollowSchema.index({ follower_id: 1, followed_id: 1 }, { unique: true });

module.exports = mongoose.model('UserFollow', userFollowSchema);
