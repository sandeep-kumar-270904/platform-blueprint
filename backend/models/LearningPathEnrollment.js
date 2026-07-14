const mongoose = require('mongoose');

const learningPathEnrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true,
    index: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate enrollments
learningPathEnrollmentSchema.index({ userId: 1, pathId: 1 }, { unique: true });

module.exports = mongoose.model('LearningPathEnrollment', learningPathEnrollmentSchema);
