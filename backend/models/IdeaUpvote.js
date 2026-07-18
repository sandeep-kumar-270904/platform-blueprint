const mongoose = require('mongoose');

const ideaUpvoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Ensure one upvote per user per idea
ideaUpvoteSchema.index({ user: 1, idea: 1 }, { unique: true });

module.exports = mongoose.model('IdeaUpvote', ideaUpvoteSchema);
