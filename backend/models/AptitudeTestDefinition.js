const mongoose = require('mongoose');

const testRuleSchema = new mongoose.Schema({
  category: { type: String, enum: ['Quantitative', 'Logical', 'Verbal'], required: true },
  topic: { type: String }, // Optional, if empty, any topic from the category
  count: { type: Number, required: true, min: 1 }
});

const aptitudeTestDefinitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep' }, // Optional
  
  rules: [testRuleSchema],
  
  timeLimitMinutes: { type: Number, required: true, min: 1 },
  allowBackwardNavigation: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AptitudeTestDefinition', aptitudeTestDefinitionSchema);
