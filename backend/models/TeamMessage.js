const mongoose = require('mongoose');

const TeamMessageSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() { return this.type === 'text' || this.type === 'system'; },
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    fileType: String,
    size: Number
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TeamMessageSchema.index({ team: 1, _id: -1 });

module.exports = mongoose.model('TeamMessage', TeamMessageSchema);
