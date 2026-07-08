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
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassroomMessage', messageSchema);
