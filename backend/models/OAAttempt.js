const mongoose = require('mongoose');

const oaAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  oaDefinition: { type: mongoose.Schema.Types.ObjectId, ref: 'OADefinition', required: true },
  oaDefinitionSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  currentActiveSectionIndex: { type: Number, default: 0 },
  
  scheduledFor: { type: Date }, // Optional: when the simulation is scheduled to run
  startTime: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  endTime: { type: Date },
  
  status: { type: String, enum: ['Planned', 'In Progress', 'Completed', 'Abandoned'], default: 'In Progress' },
  
  // Mixed sections (we'll store the generated questions here so the attempt is isolated)
  sections: [{
    title: String,
    type: { type: String, enum: ['Coding', 'Debugging', 'Aptitude'] },
    codingResponses: [{
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'DSAProblem' },
      code: String,
      language: String,
      testCasesPassed: Number,
      totalTestCases: Number,
      score: Number
    }],
    aptitudeResponses: [{
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' },
      selectedAnswer: Number,
      isCorrect: Boolean
    }]
  }],

  // Results
  overallScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  tabSwitches: { type: Number, default: 0 } // Basic proctoring metric
}, { timestamps: true });

module.exports = mongoose.model('OAAttempt', oaAttemptSchema);
