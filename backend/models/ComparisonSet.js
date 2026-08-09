const mongoose = require('mongoose');

const comparisonSetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, default: 'My Comparison' },
  colleges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }],
  shareToken: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('ComparisonSet', comparisonSetSchema);
