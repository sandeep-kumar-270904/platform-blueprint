const mongoose = require('mongoose');

const classroomLearningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualClassroom',
    required: true
  }],
  category: {
    type: String,
    default: "General"
  }
}, { timestamps: true });

module.exports = mongoose.model('ClassroomLearningPath', classroomLearningPathSchema);
