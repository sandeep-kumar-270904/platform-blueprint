const mongoose = require('mongoose');

const quizDisputeSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  questionIndex: { type: Number, required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  proposedCorrectIndex: { type: Number },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  adminResolution: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('QuizDispute', quizDisputeSchema);
