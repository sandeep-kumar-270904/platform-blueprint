const mongoose = require('mongoose');

const quizCommentSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  isPinned: { type: Boolean, default: false },
  flags: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('QuizComment', quizCommentSchema);
