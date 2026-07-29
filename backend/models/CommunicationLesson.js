const mongoose = require('mongoose');

const communicationLessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
  iconName: { type: String, default: 'MessageCircle' }, // To map to frontend icons
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CommunicationLesson', communicationLessonSchema);
