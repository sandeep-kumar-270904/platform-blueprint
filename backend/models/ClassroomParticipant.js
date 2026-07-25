const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  classroom_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualClassroom',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'participant', 'moderator'],
    default: 'participant'
  },
  status: {
    type: String,
    enum: ['registered', 'attending', 'waitlisted', 'left'],
    default: 'registered'
  },
  refund_status: {
    type: String,
    enum: ['none', 'requested', 'processed', 'rejected'],
    default: 'none'
  },
  reminders_opt_in: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  host_response: {
    type: String,
    default: null
  },
  host_responded_at: {
    type: Date
  },
  joined_live_at: {
    type: Date,
    default: null
  },
  group_name: {
    type: String,
    default: null
  },
  technical_issue: {
    type: Boolean,
    default: false
  },
  technical_issue_details: {
    type: String,
    default: null
  }
}, { timestamps: true });

// A user can only have one participant record per classroom
participantSchema.index({ classroom_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('ClassroomParticipant', participantSchema);
