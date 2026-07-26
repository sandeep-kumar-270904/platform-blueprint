const mongoose = require('mongoose');

const TeamReportSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ["spam", "misleading", "inappropriate", "scam", "other"],
    required: true
  },
  details: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "actioned", "dismissed"],
    default: "pending"
  }
}, { timestamps: true });

// Prevent duplicate pending reports from the same user on the same team
TeamReportSchema.index({ team: 1, reportedBy: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
TeamReportSchema.index({ status: 1 });

module.exports = mongoose.model('TeamReport', TeamReportSchema);
