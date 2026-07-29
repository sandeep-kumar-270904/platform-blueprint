const mongoose = require('mongoose');

const essayResponseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  prompt: { type: String },
  content: { type: String, required: true },
  tags: [{ type: String }],
  timesUsed: { type: Number, default: 0 }
}, { timestamps: true });

essayResponseSchema.index({ userId: 1 });
essayResponseSchema.index({ tags: 1 });

module.exports = mongoose.model('EssayResponse', essayResponseSchema);
