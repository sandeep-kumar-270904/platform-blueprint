const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  domain: { type: String, required: true, unique: true, trim: true }, // e.g. "university.edu"
  seatLimit: { type: Number, required: true, min: 0 },
  seatsUsed: { type: Number, default: 0 },
  billingContact: { type: String, required: true },
  adminUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'trial', 'suspended'], default: 'trial' }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
