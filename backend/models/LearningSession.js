const mongoose = require('mongoose');

const learningSessionSchema = new mongoose.Schema({
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  session_type: { type: String, enum: ['workshop', 'qna', 'lecture', 'networking'], required: true },
  topic: { type: String },
  scheduled_at: { type: Date, required: true },
  duration_minutes: { type: Number, default: 60 },
  max_participants: { type: Number, default: 50 },
  participant_count: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
  video_link: { type: String },
  recording_url: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const LearningSession = mongoose.model('LearningSession', learningSessionSchema);

const learningSessionParticipantSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSession', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

learningSessionParticipantSchema.index({ session_id: 1, user_id: 1 }, { unique: true });

const LearningSessionParticipant = mongoose.model('LearningSessionParticipant', learningSessionParticipantSchema);

module.exports = {
  LearningSession,
  LearningSessionParticipant
};
