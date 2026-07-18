const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' }, // Optional, can be platform-run
  title: { type: String, required: true },
  mentorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile' }],
  menteeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  sessionCadence: { type: String, enum: ['weekly', 'biweekly', 'monthly'], required: true },
  structuredCurriculum: [{
    week: { type: Number, required: true },
    topic: { type: String, required: true },
    suggestedMentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile' }
  }]
}, { timestamps: true });

cohortSchema.index({ institutionId: 1 });

module.exports = mongoose.model('Cohort', cohortSchema);
