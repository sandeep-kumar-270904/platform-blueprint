const mongoose = require('mongoose');

const newsCollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can't have duplicate collection names
newsCollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('NewsCollection', newsCollectionSchema);
