const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
  authorDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  calibratedDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  source: { type: String, enum: ['manual', 'ai_generated'], default: 'manual' },
  tags: [{ type: String }],
  usageCount: { type: Number, default: 0 }
});

const questionBankSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
  questions: [questionSchema]
}, { timestamps: true });

// Limit options array length
questionSchema.path('options').validate(function(value) {
  return value.length >= 2 && value.length <= 6;
}, 'Question must have between 2 and 6 options');

// Index for efficient searching by creator
questionBankSchema.index({ ownerId: 1, category: 1 });
questionBankSchema.index({ ownerId: 1, tags: 1 });
questionBankSchema.index({ title: 'text', category: 'text' });
questionBankSchema.index({ visibility: 1 });
questionBankSchema.index({ author: 1 });
questionBankSchema.index({ tags: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
