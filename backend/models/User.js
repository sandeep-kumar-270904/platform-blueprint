const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      // password is only required if authProvider is 'local'
      return !this.authProvider || this.authProvider === 'local';
    }
  },
  googleId: { type: String, default: null },
  githubId: { type: String, default: null },
  linkedinId: { type: String, default: null },
  authProvider: { type: String, default: 'local' },
  refreshToken: { type: String, default: null },
  
  // Security & Settings
  consent: {
    accepted_at: { type: Date },
    terms_version: { type: String },
    ip_address: { type: String }
  },
  knownDevices: [{
    hash: String,
    os: String,
    browser: String,
    region: String,
    last_seen: Date
  }],
  pendingLinkProvider: {
    provider: String,
    id: String,
    expiresAt: Date
  },
  pendingEmail: { type: String, default: null },
  emailChangeToken: { type: String, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  full_name: {
    type: String
  },
  university: {
    type: String
  },
  graduation_year: {
    type: Number
  },
  degree: {
    type: String
  },
  avatar_url: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  savedColleges: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College' 
  }],
  viewedColleges: [{
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    viewedAt: { type: Date, default: Date.now }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  },
  notificationPreferences: {
    question_answered: { type: Boolean, default: true },
    review_upvoted: { type: Boolean, default: true },
    answer_upvoted: { type: Boolean, default: true },
    event_reminder: { type: Boolean, default: true },
    event_approved: { type: Boolean, default: true },
    event_rejected: { type: Boolean, default: true },
    event_cancelled_or_changed: { type: Boolean, default: true },
    waitlist_promoted: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('User', UserSchema);
