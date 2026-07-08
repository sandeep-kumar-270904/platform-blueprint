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
  }
}, { timestamps: true });

// A user can only have one participant record per classroom
participantSchema.index({ classroom_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('ClassroomParticipant', participantSchema);
