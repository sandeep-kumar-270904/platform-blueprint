const mongoose = require('mongoose');

const quizAssignmentSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  classRoster: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoster', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

// Ensure one active assignment per quiz per roster at a time
quizAssignmentSchema.index({ quiz: 1, classRoster: 1, status: 1 });

module.exports = mongoose.model('QuizAssignment', quizAssignmentSchema);
