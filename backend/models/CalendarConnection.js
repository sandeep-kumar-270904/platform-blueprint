const mongoose = require('mongoose');

const calendarConnectionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  provider: { type: String, enum: ['google'], default: 'google' },
  accessToken: { type: String, required: true }, // Encrypted at rest
  refreshToken: { type: String, required: true }, // Encrypted at rest
  tokenExpiry: { type: Date, required: true },
  syncStatus: { type: String, enum: ['active', 'error', 'revoked'], default: 'active' },
  lastSyncAt: { type: Date, default: null },
  accountId: { type: String, default: null } // e.g. email address
}, { timestamps: true });

module.exports = mongoose.model('CalendarConnection', calendarConnectionSchema);
