const mongoose = require('mongoose');

const oaSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['Coding', 'Debugging', 'Aptitude'], required: true },
  durationMinutes: { type: Number }, // Optional if the whole test shares one timer
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DSAProblem' }], // For Coding/Debugging
  aptitudeRules: [{ // For Aptitude
    category: { type: String, enum: ['Quantitative', 'Logical', 'Verbal'] },
    topic: String,
    count: Number
  }]
});

const oaDefinitionSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep', required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  totalDurationMinutes: { type: Number, required: true },
  preventSectionNavigation: { type: Boolean, default: false },
  sections: [oaSectionSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('OADefinition', oaDefinitionSchema);
