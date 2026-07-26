const mongoose = require('mongoose');

const teamAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['resolve_report', 'force_close_team', 'verify_institution', 'shadow_ban_review'],
    required: true
  },
  targetTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  details: {
    type: String
  }
}, { timestamps: true });

teamAuditLogSchema.index({ targetTeamId: 1 });
teamAuditLogSchema.index({ targetUserId: 1 });
teamAuditLogSchema.index({ adminId: 1 });
teamAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TeamAuditLog', teamAuditLogSchema);
