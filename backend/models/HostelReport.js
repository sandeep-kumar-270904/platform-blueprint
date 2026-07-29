const mongoose = require('mongoose');

const hostelReportSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce one active report per user per hostel
hostelReportSchema.index({ hostelId: 1, reporterId: 1 }, { unique: true });

module.exports = mongoose.model('HostelReport', hostelReportSchema);
