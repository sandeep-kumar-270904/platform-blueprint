const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'coach'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const CoachSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One persistent session per user
  },
  conversationHistory: [MessageSchema],
  focusAreas: [{ type: String }],
  lastInteractionAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CoachSession', CoachSessionSchema);
