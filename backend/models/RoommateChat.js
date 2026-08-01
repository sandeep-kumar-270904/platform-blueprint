const mongoose = require('mongoose');

const roommateChatSchema = new mongoose.Schema({
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoommateConnection', sparse: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoommateGroup', sparse: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentAt: { type: Date, default: Date.now }
  }],
  meetups: [{
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    calendarEventIds: { type: Map, of: String, default: {} } // map of userId -> eventId
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('RoommateChat', roommateChatSchema);
