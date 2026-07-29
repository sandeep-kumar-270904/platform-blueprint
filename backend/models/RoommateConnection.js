const mongoose = require('mongoose');

const RoommateConnectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending'
  }
}, { timestamps: true });

// Prevent duplicate pending requests
RoommateConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('RoommateConnection', RoommateConnectionSchema);
