const mongoose = require('mongoose');

const gdTopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  blurb: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy to structure', 'Hard to structure'], default: 'Easy to structure' },
  pointsFor: [{ type: String }],
  pointsAgainst: [{ type: String }],
  structureTips: { type: String },
  mistakes: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('GDTopic', gdTopicSchema);
