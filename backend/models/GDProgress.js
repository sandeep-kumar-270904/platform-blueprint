const mongoose = require('mongoose');

const gdProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Set of GDTopic IDs the user has completed at least one practice attempt for
  practicedTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GDTopic' }],
  
  // Set of CommunicationLesson IDs the user has marked as complete
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationLesson' }]
}, { timestamps: true });

module.exports = mongoose.model('GDProgress', gdProgressSchema);
