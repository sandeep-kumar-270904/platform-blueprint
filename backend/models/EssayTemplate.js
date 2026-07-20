const mongoose = require('mongoose');

const essayTemplateSchema = new mongoose.Schema({
  sourceEssayResponseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EssayResponse',
    required: true
  },
  sourceUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promptType: {
    type: String,
    required: true
  },
  structuralSummary: {
    type: String,
    required: true
  },
  fullTextShared: {
    type: Boolean,
    default: false
  },
  fullText: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  }
}, { timestamps: true });

essayTemplateSchema.index({ promptType: 1, status: 1 });

module.exports = mongoose.model('EssayTemplate', essayTemplateSchema);
