const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String, // Focus Area
    required: true
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  member_limit: {
    type: Number,
    default: 50
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberships: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['owner', 'member'],
        default: 'member'
      },
      status: {
        type: String,
        enum: ['active', 'pending'],
        default: 'active'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  resources: [
    {
      title: { type: String, required: true },
      url: { type: String, required: true },
      added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      created_at: { type: Date, default: Date.now }
    }
  ],
  last_activity: {
    type: Date,
    default: Date.now
  },
  isFlagged: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
