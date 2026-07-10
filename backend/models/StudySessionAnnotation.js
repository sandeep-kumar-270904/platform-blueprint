const mongoose = require('mongoose');

const studySessionAnnotationSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
  note_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  page_number: { type: Number, required: true },
  position: { type: Object, required: true }, // {x, y, width, height}
  color: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySessionAnnotation', studySessionAnnotationSchema);
