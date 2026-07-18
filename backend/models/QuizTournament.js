const mongoose = require('mongoose');

const quizTournamentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  format: { type: String, enum: ['single_elimination', 'round_robin', 'leaderboard_points'], required: true },
  quizIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Or Team, but keeping simple
  bracket: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible JSON representation
  status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { timestamps: true });

quizTournamentSchema.index({ status: 1 });
quizTournamentSchema.index({ format: 1 });

module.exports = mongoose.model('QuizTournament', quizTournamentSchema);
