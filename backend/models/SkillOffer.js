const mongoose = require('mongoose');

const skillOfferSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  proficiencyLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  wantsToLearn: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    trim: true,
    default: 'Flexible'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  }
}, { timestamps: true });

// Create indexes for faster search
skillOfferSchema.index({ category: 1, status: 1 });
skillOfferSchema.index({ skillName: 'text' });

skillOfferSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('SkillOffer', skillOfferSchema);
