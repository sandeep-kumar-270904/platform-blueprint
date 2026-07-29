const mongoose = require('mongoose');

const collegeAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeQuestion',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answerText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['public', 'hidden'],
    default: 'public'
  },
  flaggedCount: {
    type: Number,
    default: 0
  },
  flagReasons: [{
    reason: String,
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('CollegeAnswer', collegeAnswerSchema);
