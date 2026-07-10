const mongoose = require('mongoose');

const studySessionMessageSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySessionMessage', studySessionMessageSchema);
