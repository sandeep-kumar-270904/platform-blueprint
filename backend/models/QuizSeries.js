const mongoose = require('mongoose');

const quizSeriesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isOfficial: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('QuizSeries', quizSeriesSchema);
