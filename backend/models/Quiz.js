const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  bankQuestionId: { type: mongoose.Schema.Types.ObjectId },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String },
  points: { type: Number, default: 1 },
  authorDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  calibratedDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  source: { type: String, enum: ['manual', 'ai_generated'], default: 'manual' },
  topicName: { type: String } // For syllabus tagging
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoster' }, // For assignments
  syllabusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus' }, // For exam prep
  mode: { type: String, enum: ['solo', 'live', 'adaptive_practice', 'sectioned_exam'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  durationMinutes: { type: Number, required: true },
  perQuestionTimeLimitSeconds: { type: Number, default: 20 },
  dueDate: { type: Date }, // For assignments
  questions: [quizQuestionSchema],
  sections: [{
    title: String,
    timeLimitSeconds: Number,
    questions: [quizQuestionSchema]
  }],
  status: { type: String, enum: ['draft', 'published', 'under_review', 'closed'], default: 'draft' },
  attemptCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 }
}, { timestamps: true });

quizSchema.index({ title: 'text', description: 'text', category: 'text' });

// Virtual property for question count
quizSchema.virtual('question_count').get(function() {
  return this.questions ? this.questions.length : 0;
});

quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

quizSchema.index({ classId: 1 });
quizSchema.index({ status: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
