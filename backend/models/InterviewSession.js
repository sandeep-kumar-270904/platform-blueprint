const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Optional, if tied to a specific job board listing
  pastedJobDescription: { type: String }, // Optional, if pasted manually
  
  questions: [{
    question: { type: String, required: true },
    category: { type: String, enum: ['behavioral', 'technical', 'resume_specific'], required: true },
    userAnswer: { type: String },
    aiHint: { type: String },
    aiEvaluation: {
      strengths: [{ type: String }],
      improvementAreas: [{ type: String }],
      score: { type: Number, min: 0, max: 100 } // Constructive score
    }
  }],
  
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
