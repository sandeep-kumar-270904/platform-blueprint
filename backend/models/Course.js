const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true,
    trim: true
  },
  externalUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnailImage: {
    type: String,
    default: ''
  },
  instructor: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalEnrollments: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    index: true
  }],
  syllabus: [{
    type: String
  }]
}, { timestamps: true });

// Text index for search
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Sort indexes
CourseSchema.index({ rating: -1 });
CourseSchema.index({ totalEnrollments: -1 });
CourseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', CourseSchema);
