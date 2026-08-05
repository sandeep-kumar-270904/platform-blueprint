const mongoose = require('mongoose');

const roommateAgreementSchema = new mongoose.Schema({
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoommateConnection', sparse: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoommateGroup', sparse: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rentAmount: { type: Number, required: true },
  rentDueDate: { type: Number, min: 1, max: 31 }, // Day of the month
  status: { type: String, enum: ['draft', 'active', 'terminated'], default: 'draft' },
  calendarEventIds: { type: Map, of: String, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('RoommateAgreement', roommateAgreementSchema);
