const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  deviceLabel: { type: String, default: 'Browser' },
  lastUsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent exact duplicate endpoints across the collection
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
