const mongoose = require('mongoose');

const personalizedLearningPathSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, required: true },
  category: { type: String, required: true },
  generatedSteps: [{
    title: { type: String, required: true },
    description: { type: String },
    suggestedAction: { type: String, enum: ['book_mentor', 'take_quiz', 'apply_job', 'read_resource'] },
    targetId: { type: mongoose.Schema.Types.ObjectId }, // Flexible ref based on suggestedAction
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  lastRegeneratedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PersonalizedLearningPath', personalizedLearningPathSchema);
