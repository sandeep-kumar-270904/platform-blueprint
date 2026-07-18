const mongoose = require('mongoose');

const developerTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  tokenHash: { type: String, required: true, unique: true }, // securely hashed or just unique token for read-only
  name: { type: String, required: true }, // e.g., "My Portfolio Website"
  revoked: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DeveloperToken', developerTokenSchema);
