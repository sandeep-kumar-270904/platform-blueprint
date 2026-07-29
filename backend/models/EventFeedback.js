const mongoose = require('mongoose');

const eventFeedbackSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    default: null
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// A user can only leave one feedback per event
eventFeedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('EventFeedback', eventFeedbackSchema);
