const mongoose = require('mongoose');

const QuoteRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'plumbing', 'electrical', 'handyman', 'cleaning', 'all']
  },
  issueDescription: {
    type: String,
    required: true,
    trim: true
  },
  budgetRange: {
    type: String, // e.g., "$0 - $50", "$50 - $100", "$100 - $250", "$250+"
    default: null
  },
  photoUrl: {
    type: String,
    default: null
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Open', 'Closed-Awaiting-Decision', 'Completed', 'Accepted', 'Cancelled', 'Expired'],
    default: 'Open'
  },
  quotesReceivedCount: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // Default, would be based on user profile or request form in real app
    }
  }
}, { timestamps: true });

QuoteRequestSchema.index({ userId: 1, createdAt: -1 });
QuoteRequestSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('QuoteRequest', QuoteRequestSchema);
