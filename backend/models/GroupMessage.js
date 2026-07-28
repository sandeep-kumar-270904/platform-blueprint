const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  }
}, { timestamps: true });

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);
