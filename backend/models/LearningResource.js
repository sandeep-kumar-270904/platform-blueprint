const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema({
  youtubeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['video', 'channel', 'playlist'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String
  },
  channelId: {
    type: String
  },
  channelTitle: {
    type: String
  },
  duration: {
    type: String
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technology: {
    type: String, // E.g., 'Java', 'Git'
    required: true,
    index: true
  },
  topic: {
    type: String, // E.g., 'Collections', 'Branching'
    required: true,
    index: true
  },
  subtopic: {
    type: String, // E.g., 'HashMap', 'Cherry-pick'
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  purpose: {
    type: String, // E.g., 'Placement', 'Project', 'Learn from scratch'
    index: true
  },
  language: {
    type: String,
    default: 'English'
  },
  tags: [{
    type: String
  }],
  recommendationReason: {
    type: String
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningResource'
  }],
  next_steps: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningResource'
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  recommendationRate: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING', 'UNAVAILABLE', 'PRIVATE', 'REMOVED', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

learningResourceSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  technology: 'text',
  topic: 'text',
  subtopic: 'text',
  difficulty: 'text',
  purpose: 'text'
});

module.exports = mongoose.model('LearningResource', learningResourceSchema);
