const mongoose = require('mongoose');

const SavedProviderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true
  }
}, { timestamps: true });

// Ensure a user cannot save the same provider twice
SavedProviderSchema.index({ userId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('SavedProvider', SavedProviderSchema);
