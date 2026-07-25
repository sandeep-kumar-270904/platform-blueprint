const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity_type: { type: String, required: true },
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

auditLogSchema.index({ entity_id: 1, entity_type: 1 });
auditLogSchema.index({ actor_id: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
