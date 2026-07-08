const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  summary: { type: String, default: "" },
  ats_score: { type: Number, default: 0 },
  ats_tips: [{
    issue: String,
    severity: String,
    tip: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
