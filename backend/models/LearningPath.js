const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  goal: {
    type: String,
    required: true
  },
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  estimatedDuration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  thumbnailImage: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('LearningPath', learningPathSchema);
