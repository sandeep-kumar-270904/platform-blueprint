const mongoose = require('mongoose');

const circlePostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'IdeaCircle', required: true },
  isPinned: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('CirclePost', circlePostSchema);
