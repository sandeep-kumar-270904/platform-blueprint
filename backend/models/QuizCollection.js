const mongoose = require('mongoose');

const quizCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  isPublic: { type: Boolean, default: false },
  isEditorial: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('QuizCollection', quizCollectionSchema);
