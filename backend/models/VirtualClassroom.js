const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  host_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ""
  },
  scheduled_at: {
    type: Date,
    required: true
  },
  duration_minutes: {
    type: Number,
    default: 60
  },
  max_participants: {
    type: Number,
    default: 50
  },
  participant_count: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  join_code: {
    type: String,
    required: true,
    unique: true
  },
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'invite-only'],
    default: 'public'
  },
  type: {
    type: String,
    enum: ['interactive', 'webinar'],
    default: 'interactive'
  },
  is_paid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  room_settings: {
    mute_all: { type: Boolean, default: false },
    is_locked: { type: Boolean, default: false },
    allow_chat: { type: Boolean, default: true }
  },
  recording_url: {
    type: String,
    default: null
  },
  rating_avg: {
    type: Number,
    default: 0
  },
  rating_count: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('VirtualClassroom', classroomSchema);
