const mongoose = require('mongoose');

const scholarshipCircleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  memberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  sharedGoal: {
    type: String,
    trim: true,
  },
  sharedScholarships: [{
    scholarshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }]
}, {
  timestamps: true,
});

// Limit member size to 6 as per small accountability group requirements
scholarshipCircleSchema.pre('save', function(next) {
  if (this.memberIds && this.memberIds.length > 6) {
    return next(new Error('A Scholarship Circle can have a maximum of 6 members.'));
  }
  next();
});

scholarshipCircleSchema.index({ scholarshipId: 1 });
scholarshipCircleSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('ScholarshipCircle', scholarshipCircleSchema);
