const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  host_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  co_hosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
    enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
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
  is_featured: {
    type: Boolean,
    default: false
  },
  is_paid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  discount_codes: [{
    code: { type: String, required: true },
    percent_off: { type: Number, required: true },
    max_uses: { type: Number, default: 0 }, // 0 = unlimited
    uses: { type: Number, default: 0 }
  }],
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
  external_video_url: {
    type: String,
    default: null
  },
  transcript_text: {
    type: String,
    default: null
  },
  translated_transcripts: {
    type: Map,
    of: String,
    default: {}
  },
  ai_summary: {
    type: String,
    default: null
  },
  ai_action_items: [{
    type: String
  }],
  rating_avg: {
    type: Number,
    default: 0
  },
  rating_count: {
    type: Number,
    default: 0
  },
  parent_series_id: {
    type: String,
    default: null
  },
  series_index: {
    type: Number,
    default: 1
  },
  series_total: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String
  }],
  language: {
    type: String,
    default: 'English'
  },
  prerequisite_classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualClassroom'
  }],
  materials: [{
    title: String,
    url: String,
    uploaded_at: { type: Date, default: Date.now }
  }],
  announcements: [{
    message: String,
    created_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('VirtualClassroom', classroomSchema);
