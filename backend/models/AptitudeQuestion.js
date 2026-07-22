const mongoose = require('mongoose');

const aptitudeQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index of the correct option
  explanation: { type: String, required: true },
  category: { type: String, enum: ['Quantitative', 'Logical', 'Verbal'], required: true },
  topic: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);
