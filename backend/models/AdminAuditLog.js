const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['delete_group', 'kick_member', 'flag_group', 'unflag_group']
  },
  targetId: {
    type: String, // Can be a Group ID or User ID depending on action
    required: true
  },
  details: {
    type: Object, // Flexible JSON object to store any metadata (e.g., group name, user kicked, reason)
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
