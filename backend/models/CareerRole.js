const mongoose = require('mongoose');

const careerRoleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // e.g., "AI Engineer"
  description: { type: String },
  recommendedSkills: [{ type: String }],
  relatedRoles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CareerRole' }],
  typicalSalaryRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Text indexing for search
careerRoleSchema.index({ title: 'text', recommendedSkills: 'text' });

module.exports = mongoose.model('CareerRole', careerRoleSchema);
