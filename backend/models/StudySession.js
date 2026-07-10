const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  session_name: { type: String, required: true },
  note_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  current_page: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', studySessionSchema);
