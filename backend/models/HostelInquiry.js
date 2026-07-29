const mongoose = require('mongoose');

const hostelInquirySchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  preferredRoomType: {
    type: String,
    required: true
  },
  moveInDate: {
    type: Date,
    required: true
  },
  message: {
    type: String
  },
  status: {
    type: String,
    enum: ['sent', 'responded'],
    default: 'sent'
  }
}, { timestamps: true });

// Indexing for faster retrieval
hostelInquirySchema.index({ senderId: 1, createdAt: -1 });
hostelInquirySchema.index({ ownerId: 1, createdAt: -1 });
hostelInquirySchema.index({ hostelId: 1 });

module.exports = mongoose.model('HostelInquiry', hostelInquirySchema);
