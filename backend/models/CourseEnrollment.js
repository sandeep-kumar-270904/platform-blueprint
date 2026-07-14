const mongoose = require('mongoose');

const CourseEnrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed'],
    default: 'enrolled'
  },
  progressPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastProgressUpdateAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

// Ensure a user can only enroll in a specific course once
CourseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('CourseEnrollment', CourseEnrollmentSchema);
