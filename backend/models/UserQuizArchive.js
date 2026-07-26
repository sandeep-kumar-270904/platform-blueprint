const mongoose = require('mongoose');

const userQuizArchiveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalArchivedScore: { type: Number, default: 0 },
  totalArchivedAttempts: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('UserQuizArchive', userQuizArchiveSchema);
