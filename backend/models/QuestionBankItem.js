const mongoose = require('mongoose');

const questionBankItemSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctOptionIndex: {
    type: Number,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 1
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [{
    type: String
  }],
  usageCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Limit options array length
questionBankItemSchema.path('options').validate(function(value) {
  return value.length >= 2 && value.length <= 6;
}, 'Question must have between 2 and 6 options');

// Index for efficient searching by creator
questionBankItemSchema.index({ createdBy: 1, category: 1 });
questionBankItemSchema.index({ createdBy: 1, tags: 1 });
questionBankItemSchema.index({ createdBy: 1, questionText: 'text' });

module.exports = mongoose.model('QuestionBankItem', questionBankItemSchema);
