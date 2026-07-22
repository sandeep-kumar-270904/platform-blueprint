const mongoose = require('mongoose');

const companyPrepSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  logoUrl: { type: String },
  companyType: { type: String, enum: ['Product-based', 'Service-based', 'Startup'], required: true },
  overview: {
    hiringStages: [{ type: String }],
    eligibilityCriteria: { type: String },
    typicalRoles: [{ type: String }]
  },
  technicalQuestions: [{
    question: { type: String, required: true },
    approach: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    category: { type: String }
  }],
  hrTips: [{
    question: { type: String, required: true },
    guidance: { type: String, required: true },
    category: { type: String }
  }],
  resumeTips: [{
    tip: { type: String, required: true },
    category: { type: String }
  }],
  aptitudePattern: {
    hasAptitude: { type: Boolean, default: false },
    quantQuestions: { type: Number, default: 0 },
    logicalQuestions: { type: Number, default: 0 },
    verbalQuestions: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    notes: { type: String }
  }
}, { timestamps: true });

// Add index for search
companyPrepSchema.index({ name: 'text', companyType: 'text' });

module.exports = mongoose.model('CompanyPrep', companyPrepSchema);
