const mongoose = require('mongoose');
const crypto = require('crypto');

const groupInviteSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup', required: true },
  token: { type: String, required: true, unique: true },
  role: { type: String, enum: ['member', 'moderator'], default: 'member' },
  expires_at: { type: Date, required: true },
  max_uses: { type: Number, default: 25 },
  uses: { type: Number, default: 0 },
  revoked: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Pre-save hook to generate token
groupInviteSchema.pre('validate', function(next) {
  if (!this.token) {
    this.token = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('GroupInvite', groupInviteSchema);
