const mongoose = require('mongoose');

const syllabusProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus', required: true },
  topicCoverage: [{
    topicName: { type: String, required: true },
    questionsAttempted: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// Virtual for correctRate
syllabusProgressSchema.virtual('topicCoverageWithRate').get(function() {
  return this.topicCoverage.map(tc => ({
    topicName: tc.topicName,
    questionsAttempted: tc.questionsAttempted,
    correctCount: tc.correctCount,
    correctRate: tc.questionsAttempted > 0 ? (tc.correctCount / tc.questionsAttempted) * 100 : 0
  }));
});

syllabusProgressSchema.set('toJSON', { virtuals: true });
syllabusProgressSchema.set('toObject', { virtuals: true });

syllabusProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('SyllabusProgress', syllabusProgressSchema);
