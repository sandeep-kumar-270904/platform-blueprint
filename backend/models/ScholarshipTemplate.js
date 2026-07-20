const mongoose = require('mongoose');

const scholarshipTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalEssayId: { type: mongoose.Schema.Types.ObjectId, ref: 'EssayBank' },
  promptType: { type: String, required: true },
  structureSummary: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScholarshipTemplate', scholarshipTemplateSchema);
