const mongoose = require('mongoose');

const quizReportSchema = new mongoose.Schema({
  targetType: { 
    type: String, 
    enum: ['quiz'], 
    required: true,
    default: 'quiz'
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'Quiz'
  },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    enum: ['incorrect_answers', 'inappropriate_content', 'spam', 'plagiarism', 'other'],
    required: true
  },
  details: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed_actioned', 'reviewed_dismissed'], 
    default: 'pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  adminNote: { type: String }
}, { timestamps: true });

// Prevent duplicate reporting
quizReportSchema.index({ targetType: 1, targetId: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('QuizReport', quizReportSchema);
