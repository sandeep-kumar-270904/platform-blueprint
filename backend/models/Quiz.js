const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correct_index: { type: Number, required: true },
  explanation: { type: String },
  position: { type: Number, default: 0 }
});

const quizAttemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  time_taken_seconds: { type: Number, required: true },
  answers: [{ type: Number }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const quizSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  duration_minutes: { type: Number, default: 10 },
  attempts_count: { type: Number, default: 0 },
  is_public: { type: Boolean, default: true },
  questions: [quizQuestionSchema],
  attempts: [quizAttemptSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Virtual property to get question count based on questions array
quizSchema.virtual('question_count').get(function() {
  return this.questions ? this.questions.length : 0;
});

// Ensure virtuals are included when converting document to JSON
quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Quiz', quizSchema);
