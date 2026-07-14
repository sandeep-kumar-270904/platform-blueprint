const mongoose = require('mongoose');

const CourseRatingSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
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
    trim: true,
    default: ''
  }
}, { timestamps: true });

// A user can only rate a course once
CourseRatingSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('CourseRating', CourseRatingSchema);
