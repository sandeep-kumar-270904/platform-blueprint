const mongoose = require('mongoose');

const AuthEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: { 
    type: String, 
    enum: ['login_success', 'login_failed', 'password_changed', 'account_deleted', 'account_linked'],
    required: true
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuthEvent', AuthEventSchema);
