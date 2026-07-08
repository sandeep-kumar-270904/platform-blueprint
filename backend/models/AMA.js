const mongoose = require('mongoose');

const amaSessionSchema = new mongoose.Schema({
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  topic: { type: String, required: true },
  scheduled_at: { type: Date, required: true },
  duration_minutes: { type: Number, default: 60 },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  max_participants: { type: Number, default: 100 },
  participant_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const AMASession = mongoose.model('AMASession', amaSessionSchema);

const amaQuestionSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AMASession', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  answer: { type: String, default: null },
  upvotes: { type: Number, default: 0 },
  is_answered: { type: Boolean, default: false },
  is_pinned: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const AMAQuestion = mongoose.model('AMAQuestion', amaQuestionSchema);

const amaQuestionVoteSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AMAQuestion', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

amaQuestionVoteSchema.index({ question_id: 1, user_id: 1 }, { unique: true });

const AMAQuestionVote = mongoose.model('AMAQuestionVote', amaQuestionVoteSchema);

module.exports = {
  AMASession,
  AMAQuestion,
  AMAQuestionVote
};
