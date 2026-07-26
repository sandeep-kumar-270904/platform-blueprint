const mongoose = require('mongoose');

const quizPurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  stripePaymentIntentId: { type: String }
}, { timestamps: true });

quizPurchaseSchema.index({ user: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model('QuizPurchase', quizPurchaseSchema);
