const mongoose = require('mongoose');

const referrerReportSchema = new mongoose.Schema({
  reportedProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferrerProfile', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reasonCategory: { type: String, default: 'suspicious' },
  details: { type: String },
  status: { type: String, enum: ['Pending', 'Reviewed', 'ActionTaken', 'Dismissed'], default: 'Pending' }
}, { timestamps: true });

// One active report per reporter/profile pair (if Pending)
referrerReportSchema.index({ reporter: 1, reportedProfile: 1, status: 1 });

module.exports = mongoose.model('ReferrerReport', referrerReportSchema);
