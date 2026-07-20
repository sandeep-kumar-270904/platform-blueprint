const mongoose = require('mongoose');

const buddyMatchRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'matched', 'cancelled'],
    default: 'waiting'
  },
  preferredCategories: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Unique partial index: one active waiting request per user
buddyMatchRequestSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: 'waiting' } }
);

module.exports = mongoose.model('BuddyMatchRequest', buddyMatchRequestSchema);
