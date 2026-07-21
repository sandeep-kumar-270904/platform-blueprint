const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    required: true 
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true }
}, { timestamps: true });

adminActionLogSchema.index({ adminId: 1 });
adminActionLogSchema.index({ actionType: 1 });
adminActionLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AdminActionLog', adminActionLogSchema);
