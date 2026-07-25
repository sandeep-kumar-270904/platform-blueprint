const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  sender_name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassroomMessage',
    default: null
  },
  reactions: [{
    emoji: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassroomMessage', messageSchema);
