const mongoose = require('mongoose');

const RoomInquirySchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomRental',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  moveInDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Pending', 'Responded'],
    default: 'Pending',
  },
  replyMessage: {
    type: String,
    trim: true,
  },
  repliedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RoomInquiry', RoomInquirySchema);
