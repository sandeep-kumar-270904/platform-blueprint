const mongoose = require('mongoose');

const QuoteResponseSchema = new mongoose.Schema({
  quoteRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuoteRequest',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true
  },
  priceEstimate: {
    type: String, // e.g., "$150", "Hourly $45/hr"
    required: true
  },
  estimatedTimeframe: {
    type: String, // e.g., "Tomorrow morning", "Within 2 hours"
    required: true
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Declined-by-user', 'Withdrawn', 'Expired'],
    default: 'Pending'
  }
}, { timestamps: true });

QuoteResponseSchema.index({ quoteRequestId: 1, providerId: 1 }, { unique: true }); // One quote per provider per request
QuoteResponseSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model('QuoteResponse', QuoteResponseSchema);
