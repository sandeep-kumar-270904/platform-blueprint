const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  narrative: { type: String, required: true }, // Rich text
  companyLanded: { type: String },
  roleTitle: { type: String },
  linkedResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  linkedPortfolioSlug: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'published'], 
    default: 'draft' 
  },
  submittedAt: { type: Date }
}, { timestamps: true });

successStorySchema.index({ status: 1 });
successStorySchema.index({ userId: 1 });

module.exports = mongoose.model('SuccessStory', successStorySchema);
