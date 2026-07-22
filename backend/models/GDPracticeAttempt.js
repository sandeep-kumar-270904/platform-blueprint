const mongoose = require('mongoose');

const gdPracticeAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'GDTopic', required: true },
  
  notes: {
    opening: String,
    body: String,
    closing: String
  },
  
  checklist: {
    structure: { type: Boolean, default: false },
    acknowledge: { type: Boolean, default: false },
    onTopic: { type: Boolean, default: false },
    eyeContact: { type: Boolean, default: false } // optional extra
  },
  
  // Snapshot of topic to preserve integrity if admin changes the topic later
  topicSnapshot: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

module.exports = mongoose.model('GDPracticeAttempt', gdPracticeAttemptSchema);
