const mongoose = require('mongoose');

const ideaSaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Ensure one save per user per idea
ideaSaveSchema.index({ user: 1, idea: 1 }, { unique: true });

module.exports = mongoose.model('IdeaSave', ideaSaveSchema);
