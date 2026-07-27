const mongoose = require('mongoose');

const skillExchangeRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillOffer',
    required: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  scheduledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('SkillExchangeRequest', skillExchangeRequestSchema);
