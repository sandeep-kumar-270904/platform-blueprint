const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Team title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  // Keep name for backwards compatibility with innovation.js
  name: { type: String },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  logo_url: { type: String, default: null }, // Backwards compat
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  teamSize: {
    current: {
      type: Number,
      default: 1 // Creator is usually 1
    },
    max: {
      type: Number,
      required: [true, 'Max team size is required'],
      min: [2, 'Team must have at least 2 members']
    }
  },
  requiredRoles: [{
    type: String,
    trim: true
  }],
  requiredSkills: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Hackathon', 'Research', 'Startup', 'Course Project', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['open', 'full', 'closed', 'completed', 'requires_admin_approval'],
    default: 'open'
  },
  visibility: {
    type: String,
    enum: ['public', 'invite-only'],
    default: 'public'
  },
  flagged: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  maxApplicants: {
    type: Number
  },
  completedAt: {
    type: Date
  },
  disbandReason: {
    type: String
  },
  deadline: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  badges: [{
    type: String
  }],
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  }
}, {
  timestamps: true
});

// Indexes for search and filtering
TeamSchema.index({
  title: 'text',
  description: 'text',
  requiredSkills: 'text'
});
TeamSchema.index({ status: 1 });
TeamSchema.index({ category: 1 });
TeamSchema.index({ createdAt: -1 });
TeamSchema.index({ creator: 1 });
TeamSchema.index({ institution: 1 });

module.exports = mongoose.model('Team', TeamSchema);
