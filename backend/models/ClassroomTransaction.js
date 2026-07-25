const mongoose = require('mongoose');

const ClassroomTransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualClassroom', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  stripe_tx_id: { type: String },
  is_refunded: { type: Boolean, default: false },
  discount_code_used: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClassroomTransaction', ClassroomTransactionSchema);
