const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    required: true 
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  modelName: { type: String }, // Which collection was modified (if applicable)
  reason: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed } // Stores { before, after } or specific diffs
}, { timestamps: true });

adminActionLogSchema.index({ adminId: 1 });
adminActionLogSchema.index({ actionType: 1 });
adminActionLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AdminActionLog', adminActionLogSchema);
