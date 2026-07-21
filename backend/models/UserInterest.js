const mongoose = require('mongoose');

const userInterestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('UserInterest', userInterestSchema);
