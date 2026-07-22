const mongoose = require('mongoose');

const searchQueryLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now, expires: 604800 } // Auto-delete after 7 days
});

searchQueryLogSchema.index({ user_id: 1, createdAt: -1 });
searchQueryLogSchema.index({ query: 1, createdAt: -1 });

module.exports = mongoose.model('SearchQueryLog', searchQueryLogSchema);
