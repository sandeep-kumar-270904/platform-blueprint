const mongoose = require('mongoose');

const applicationStatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  status: {
    type: String,
    enum: ['Planning to Apply', 'Applied', 'Waitlisted', 'Accepted', 'Rejected', 'Enrolled'],
    default: 'Planning to Apply'
  },
  appliedDate: { type: Date },
  decisionDate: { type: Date },
  notes: { type: String, maxLength: 1000 }
}, { timestamps: true });

// A user can only have one application status per college
applicationStatusSchema.index({ userId: 1, collegeId: 1 }, { unique: true });

module.exports = mongoose.model('ApplicationStatus', applicationStatusSchema);
