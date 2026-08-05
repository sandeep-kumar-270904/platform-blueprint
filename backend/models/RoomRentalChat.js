const mongoose = require('mongoose');

const RoomRentalChatSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomRental', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }]
}, { timestamps: true });

RoomRentalChatSchema.index({ room: 1, participants: 1 });

module.exports = mongoose.model('RoomRentalChat', RoomRentalChatSchema);
