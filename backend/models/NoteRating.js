const mongoose = require('mongoose');

const noteRatingSchema = new mongoose.Schema({
  note_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Ensure a user can only rate a note once
noteRatingSchema.index({ note_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('NoteRating', noteRatingSchema);
