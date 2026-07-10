const mongoose = require('mongoose');

const studySessionParticipantSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joined_at: { type: Date, default: Date.now }
});

// unique compound index for session/user to prevent double joins
studySessionParticipantSchema.index({ session_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('StudySessionParticipant', studySessionParticipantSchema);
