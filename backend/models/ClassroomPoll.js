const mongoose = require('mongoose');

const classroomPollSchema = new mongoose.Schema({
  classroom_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualClassroom',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  voted_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassroomPoll', classroomPollSchema);
